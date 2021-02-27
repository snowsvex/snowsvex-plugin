import yaml from 'js-yaml';
import { compile } from 'mdsvex';

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

export { compileWithFrontmatter };
