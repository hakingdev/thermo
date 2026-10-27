import test from "node:test";
import assert from "node:assert/strict";
import { build } from "vite";

test("production bootstrap loads each storefront's own stylesheet", async () => {
  const result = await build({ logLevel: "silent", build: { write: false } });
  const output = (Array.isArray(result) ? result : [result]).flatMap((bundle) => bundle.output);
  const bootstrap = output.find((file) => file.type === "chunk" && file.isEntry);
  assert.ok(bootstrap, "production bootstrap must exist");

  const stylesheets = ["/columbia-site/src/site.js", "/src/sites/kryga.js"].map((entry) => {
    const chunk = output.find((file) => file.type === "chunk" && file.moduleIds.some((id) => id.endsWith(entry)));
    assert.ok(chunk, `missing storefront: ${entry}`);
    const css = [...chunk.viteMetadata.importedCss];
    assert.ok(css.length, `missing stylesheet: ${entry}`);
    for (const filename of css) {
      assert.ok(bootstrap.code.includes(filename), `bootstrap must load ${entry}'s stylesheet ${filename}`);
    }
    return css;
  });
  assert.notDeepEqual(stylesheets[0], stylesheets[1], "the storefronts must keep separate stylesheets");
});
