# Snowsvex Plugin

> Snowpack plugin for building svex-y static sites with svelte

Compile Svelte and svelte-scented markdown _(aka MDSvex)_ into static pages using Snowpack.

## Installation

📦 Install with your favourite package manager

```sh
npm i -D @snowsvex/snowsvex-plugin
yarn add -D @snowsvex/snowsvex-plugin
pnpm i -D @snowsvex/snowsvex-plugin
```

❄️ And then add it to your `snowpack.config.js` plugins

```json
  "plugins": [
    ...
    '@snowsvex/snowsvex-plugin',
  ],
  ...
```

## Configuration

By default any `.svelte` or `.svx` files in your `src/pages` directory will generate html files.

You can change this by adding to the plugin config in `snowpack.config.js`

```json
  "plugins": [
    ...
    ['@snowsvex/snowsvex-plugin', {
      pagesDirs: ['pages', 'articles', 'foo', 'superfoo']
    }],
  ],
  ...
```

`pagesDirs` expects a `string[]` of directory names to look in for files to generate static pages from.

## Output Files

Issues currently exist with file names keeping their `.svelte` / `.svx` extensions

This can be circumvented by using the `@snowsvex/snowsvex-builder` package to build or writing your own custom node script to move/rename the files as you wish!

Using `@snowsvex/snowsvex`, add the build script to your `package.json` scripts.

```json
  "scripts": {
    "build": "snowsvex build",
    ...
  },
```

The `pages` directory is special and if present will generate html files at the root of your build directory. This is so no special routing needs to take place when your awesome new static site hits the server. All other directories will be placed in `[DIR]/[FILE_NAME]` in your build directory.

### Dev Mode

Issues exist with snowpack not understanding multiple output files when in dev mode. This can be avoided

## TODO

- [ ] Setup Github action to autodeploy to npm
- [ ] gif showing output directory structure
