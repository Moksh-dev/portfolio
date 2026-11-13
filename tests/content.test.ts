import assert from "node:assert/strict";
import { test } from "node:test";
import { portfolio, publicEntries, type PortfolioEntry } from "../src/content/portfolio";
import { constellationEdges } from "../src/lib/world";

test("every entry has a unique stable ID and valid related entries", () => {
  const ids = portfolio.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const entry of portfolio) {
    assert.ok(entry.title && entry.description && entry.details.length);
    assert.ok(["completed", "ongoing", "exploratory"].includes(entry.status));
    for (const related of entry.relatedIds) {
      assert.ok(ids.includes(related), `${entry.id} references missing entry ${related}`);
      assert.notEqual(related, entry.id);
    }
    assert.ok(entry.visual.position.every(Number.isFinite));
    if (entry.source) assert.equal(new URL(entry.source.url).protocol, "https:");
  }
});

test("private editorial notes never enter the public payload", () => {
  const privateEntry: PortfolioEntry = { ...portfolio[0], privateEditorialNotes: "DO_NOT_PUBLISH_EDITORIAL_NOTE" };
  const output = publicEntries([privateEntry]);
  assert.equal(output[0].title, privateEntry.title);
  assert.ok(!("privateEditorialNotes" in output[0]));
  assert.ok(!JSON.stringify(output).includes("DO_NOT_PUBLISH_EDITORIAL_NOTE"));
  assert.equal(privateEntry.privateEditorialNotes, "DO_NOT_PUBLISH_EDITORIAL_NOTE");
});

test("new entries join the constellation without rendering changes or duplicate edges", () => {
  const added: PortfolioEntry = { ...portfolio[1], id: "future-entry", title: "Owner-approved future entry", relatedIds: ["one-line"] };
  const entries = publicEntries([...portfolio, added]);
  const edges = constellationEdges(entries);
  assert.ok(edges.some((edge) => edge.from === added.id && edge.to === "one-line"));
  assert.equal(new Set(edges.map((edge) => edge.id)).size, edges.length);
});
