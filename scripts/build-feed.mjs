import { createHash } from "node:crypto";
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

class FeedBuilder {
  constructor(root) {
    this.root = root;
    this.control = this.#readControl();
    this.feedDirectory = join(root, "dist", "feed");
  }

  build() {
    const artifactName = `glinet-github-jump-users_${this.control.Version}_all.ipk`;
    const artifact = join(this.root, "dist", artifactName);
    const bytes = readFileSync(artifact);

    rmSync(this.feedDirectory, { force: true, recursive: true });
    mkdirSync(this.feedDirectory, { recursive: true });
    copyFileSync(artifact, join(this.feedDirectory, artifactName));

    const packages = this.#packageIndex(artifactName, bytes);
    writeFileSync(join(this.feedDirectory, "Packages"), packages);
    writeFileSync(
      join(this.feedDirectory, "Packages.gz"),
      gzipSync(packages, { level: 9, mtime: 0 }),
    );
    writeFileSync(join(this.feedDirectory, "index.html"), this.#indexPage(artifactName));

    console.log(this.feedDirectory);
  }

  #digest(algorithm, bytes) {
    return createHash(algorithm).update(bytes).digest("hex");
  }

  #indexPage(artifactName) {
    return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GL.iNet GitHub Jump Users feed</title>
<h1>GL.iNet GitHub Jump Users feed</h1>
<p>Add this URL as an OPKG custom software source.</p>
<p><code>https://phvv-me.github.io/glinet-github-jump-users</code></p>
<p><a href="${artifactName}">Download ${artifactName}</a></p>
`;
  }

  #packageIndex(artifactName, bytes) {
    const fields = Object.entries(this.control)
      .map(([name, value]) => `${name}: ${value}`)
      .join("\n");
    return `${fields}
Filename: ${artifactName}
Size: ${statSync(join(this.root, "dist", artifactName)).size}
MD5Sum: ${this.#digest("md5", bytes)}
SHA256sum: ${this.#digest("sha256", bytes)}

`;
  }

  #readControl() {
    const controlPath = join(this.root, "package", "CONTROL", "control");
    const fields = Object.fromEntries(
      readFileSync(controlPath, "utf8")
        .trim()
        .split(/\r?\n/)
        .map((line) => {
          const separator = line.indexOf(":");
          if (separator < 1) {
            throw new Error(`Invalid control line: ${line}`);
          }
          return [line.slice(0, separator), line.slice(separator + 1).trim()];
        }),
    );
    for (const required of ["Package", "Version", "Architecture", "Description"]) {
      if (!fields[required]) {
        throw new Error(`Missing control field: ${required}`);
      }
    }
    return fields;
  }
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
new FeedBuilder(resolve(scriptDirectory, "..")).build();
