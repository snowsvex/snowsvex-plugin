import fs from 'fs/promises';
import svelte from 'svelte/compiler';
import { mdsvex, compile } from 'mdsvex';
import { SnowpackPlugin, SnowpackUserConfig } from 'snowpack';
import { CompileOptions } from 'svelte/types/compiler/interfaces';
import { SnowsvexPluginOpts } from './types';
import { generateHtml } from './html';

export default function plugin(
  snowpackConfig: SnowpackUserConfig,
  opts: SnowsvexPluginOpts
): SnowpackPlugin {
  const pagesDirs = opts.pagesDirs || ['pages'];
  const isDev = process.env.NODE_ENV !== 'production';
  const useSourceMaps = snowpackConfig.buildOptions?.sourcemap;

  return {
    name: 'snowsvex-plugin',
    resolve: {
      input: ['.svelte', '.svx'],
      output: ['.js', '.css', '.html'],
    },
    knownEntrypoints: [
      'svelte/internal',
      'svelte-hmr/runtime/hot-api-esm.js',
      'svelte-hmr/runtime/proxy-adapter-dom.js',
    ],
    /**
     * @returns the plugin options
     * Can be called externally by the build script later
     */
    config() {
      return { ...opts };
    },
    async load({ filePath, isSSR }) {
      const segments = filePath.split('/');
      const filename = segments[segments.length - 1].split('.')[0];

      const contents = await fs.readFile(filePath, 'utf-8');
      if (filePath.endsWith('.svx')) {
        const s = await compile(filePath);
        console.log({ s });
      }

      const svexOpts = {
        // layout: './src/Layout.svelte' // TODO make this dynamic
      };
      //@ts-ignore -- mdsvex + svelte not playing nice!
      const preprocessed = await svelte.preprocess(contents, mdsvex(svexOpts), {
        filename: filePath,
      });
      if (!preprocessed.toString) {
        throw new Error(
          'No toString method returned from svelte preprocess stage'
        );
      }
      const compileOptions: CompileOptions = {
        generate: isSSR ? 'ssr' : 'dom',
        hydratable: true,
        css: false,
        dev: isDev,
        outputFilename: filePath,
        filename: filePath,
      };

      const compiled = svelte.compile(preprocessed.toString(), compileOptions);
      const { js, css } = compiled;
      const output = {
        '.js': {
          code: js.code,
          map: useSourceMaps ? js.map : undefined,
        },
      };

      if (!compileOptions.css && css && css.code) {
        output['.css'] = {
          code: css.code,
          map: useSourceMaps ? css.map : undefined,
        };
      }

      await Promise.all(
        pagesDirs.map(async dir => {
          if (filePath.includes(dir)) {
            const html = await generateHtml({
              dir,
              filePath,
              filename,
            });
            output['.html'] = { code: html };
          }
        })
      );

      return output;
    },
  };
}
