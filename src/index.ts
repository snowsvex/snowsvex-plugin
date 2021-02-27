import fs from 'fs/promises';
import svelte from 'svelte/compiler';
import { mdsvex, compile } from 'mdsvex';
import yaml from 'js-yaml';
import { SnowpackPlugin, SnowpackUserConfig } from 'snowpack';
import { CompileOptions } from 'svelte/types/compiler/interfaces';

interface PluginOpts {
  /**
   * path to the default HTML template to use for generating pages
   */
  defaultTemplate?: string;
  /**
   * list of directories to generate static pages for
   * @default ['pages']
   */
  pagesDirs?: (string | { dir: string; template: string })[];
}

export default function plugin(
  snowpackConfig: SnowpackUserConfig,
  opts: PluginOpts
): SnowpackPlugin {
  const defaultTemplate = opts.defaultTemplate || './snowsvex-plugin/base.html';
  const pagesDirs = opts.pagesDirs || [
    { dir: 'pages', template: defaultTemplate },
  ];
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
    config() {
      return { ...opts, defaultTemplate };
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
      //@ts-ignore
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
        pagesDirs.map(async opt => {
          const { dir, template } =
            typeof opt === 'object'
              ? opt
              : { dir: opt, template: defaultTemplate };
          if (filePath.includes(dir)) {
            const html = await generateHtml({
              dir,
              filePath,
              filename,
              template,
            });
            output['.html'] = { code: html };
          }
        })
      );

      return output;
    },
  };
}

type GenerateHtmlProps = {
  dir: string;
  filePath: string;
  filename: string;
  template: string;
  title?: string;
};
async function generateHtml({
  dir,
  filePath,
  filename,
  template,
  title,
}: GenerateHtmlProps) {
  console.log(`processing page at ${filePath}`);
  const base = await fs.readFile(template, 'utf-8');
  const outputJs = `/${dir}/${filename.replace('.svelte', '.js')}`;
  const outputCss = `/${dir}/${filename}.css`;
  const processedHtml = base
    .replace('{{COMP}}', outputJs)
    .replace('{{TITLE}}', title || filename)
    .replace('{{CSS}}', outputCss);
  return processedHtml;
}

async function compileWithFrontmatter(filePath: string) {
  let frontmatter: Record<string, unknown> = {};
  const output = await compile(filePath, {
    frontmatter: {
      type: 'yaml',
      marker: '-',
      parse: fm => {
        const matter = yaml.load(fm) as Record<string, unknown>;
        frontmatter = matter;
        return matter;
      },
    },
  });
  return {
    ...output,
    frontmatter,
  };
}
