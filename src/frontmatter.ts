import yaml from 'js-yaml';
import { compile } from 'mdsvex';
import { readFile } from 'fs/promises';

async function compileWithFrontmatter(filePath: string) {
  const file = await readFile(filePath, 'utf-8');
  const pre = file.split('---\n')[1];
  const frontmatter = yaml.load(pre) as Record<string, unknown>;
  const output = await compile(filePath);
  return {
    ...output,
    frontmatter,
  };
}

export { compileWithFrontmatter };
