import { readFile, rm, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import vueCompiler from "vue-template-compiler";
import transpile from "vue-template-es2015-compiler";

const { compile } = vueCompiler;

const template = await readFile("src/template.html", "utf8");
const component = await readFile("src/component.js", "utf8");
const layout = await readFile("src/layout.css", "utf8");
const compiled = compile(template, {
  comments: false,
  outputSourceRange: true,
  whitespace: "condense",
});

if (compiled.errors.length) {
  throw new Error(compiled.errors.map(String).join("\n"));
}

const render = transpile(`function render() { ${compiled.render} }`);
const staticRenderFns = compiled.staticRenderFns
  .map((source, index) =>
    transpile(`function staticRender${index}() { ${source} }`),
  )
  .join(",\n");
const output = `"use strict";
(() => {
const styleId = "github-jump-users-layout";
if (typeof document !== "undefined") {
  let style = document.getElementById(styleId);
  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.appendChild(style);
  }
  style.textContent = ${JSON.stringify(layout)};
}
const component = ${component.trim()};
component.render = ${render};
component.staticRenderFns = [${staticRenderFns}];
return component;
})()
`;

const view = "package/data/www/views/gl-sdk4-ui-github-jump-users.common.js";
await rm(view, { force: true });
await writeFile(`${view}.gz`, gzipSync(output, { level: 9, mtime: 0 }));
