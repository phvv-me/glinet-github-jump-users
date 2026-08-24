import { readFile, writeFile } from "node:fs/promises";
import vueCompiler from "vue-template-compiler";

const { compile } = vueCompiler;

const template = await readFile("src/template.html", "utf8");
const component = await readFile("src/component.js", "utf8");
const compiled = compile(template, {
  comments: false,
  outputSourceRange: true,
  whitespace: "condense",
});

if (compiled.errors.length) {
  throw new Error(compiled.errors.map(String).join("\n"));
}

const staticRenderFns = compiled.staticRenderFns
  .map((render) => `function () { ${render} }`)
  .join(",\n");
const output = `(() => {
  const component = ${component.trim()};
  component.render = function () { ${compiled.render} };
  component.staticRenderFns = [${staticRenderFns}];
  return component;
})()\n`;

await writeFile(
  "package/data/www/views/gl-sdk4-ui-github-jump-users.common.js",
  output,
);
