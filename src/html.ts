import { compileWithFrontmatter } from './frontmatter';

type GenerateHtmlProps = {
  dir: string;
  filePath: string;
  filename: string;
};
async function generateHtml({
  dir,
  filePath,
  filename,
}: GenerateHtmlProps): Promise<string> {
  console.log(`processing page at ${filePath}`);

  let title: string | undefined;
  let description = 'Web page created with Snowsvex!';
  /**
   * Try to get the title from the frontmatter
   */
  if (filePath.endsWith('.svx')) {
    const { frontmatter } = await compileWithFrontmatter(filePath);
    title = typeof frontmatter.title === 'string' ? frontmatter.title : title;
    description =
      typeof frontmatter.description === 'string'
        ? frontmatter.description
        : description;
  }

  const outputJs = `/${dir}/${filename.replace('.svelte', '.js')}`;
  const outputCss = `/${dir}/${filename}.css`;
  const processedHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${description}" />
    <title>${title}</title>
    <link rel="stylesheet" href="${outputCss}" />
  </head>
  <body>
    <!-- [PRERENDER] -->
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <script type="module">
      import comp from '/${outputJs}'

      let app = new comp({
        target: document.body,
        hydrate: true
      })
    </script>
  </body>
</html>
  `;
  return processedHtml;
}

export { generateHtml };
