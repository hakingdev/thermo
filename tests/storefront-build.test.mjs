import test from "node:test";
import assert from "node:assert/strict";
import { build } from "vite";

test("production bootstrap loads each storefront's own stylesheet", async () => {
  const result = await build({ logLevel: "silent", build: { write: false } });
  const output = (Array.isArray(result) ? result : [result]).flatMap((bundle) => bundle.output);
  const bootstrap = output.find((file) => file.type === "chunk" && file.isEntry);
  assert.ok(bootstrap, "production bootstrap must exist");

  const html = String(output.find(file => file.type === "asset" && file.fileName === "index.html")?.source || "");
  const importedStyles = (chunk, seen = new Set()) => {
    if (!chunk || seen.has(chunk.fileName)) return [];
    seen.add(chunk.fileName);
    return [...chunk.viteMetadata.importedCss, ...chunk.imports.flatMap(name => importedStyles(output.find(file => file.type === "chunk" && file.fileName === name), seen))];
  };
  const stylesheets = ["/columbia-site/src/site.js", "/src/sites/kryga.js", "/src/sites/boots.jsx"].map((entry) => {
    const chunk = output.find((file) => file.type === "chunk" && file.moduleIds.some((id) => id.endsWith(entry)));
    assert.ok(chunk, `missing storefront: ${entry}`);
    const css = [...new Set(importedStyles(chunk))];
    assert.ok(css.length, `missing stylesheet: ${entry}`);
    for (const filename of css) {
      assert.ok((bootstrap.code.includes(filename) || html.includes(filename)), `bootstrap must load ${entry}'s stylesheet ${filename}`);
    }
    return css;
  });
  assert.notDeepEqual(stylesheets[0], stylesheets[1], "Columbia keeps its own stylesheet");
  assert.deepEqual([...stylesheets[1]].sort(), [...stylesheets[2]].sort(), "Boots shares the KRYGA design system through static imports");
});
