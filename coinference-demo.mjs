/**
 * coinference-demo.mjs — co-inference from .pntg to .pntg, across a boundary.
 *
 * Agent A and Agent B share NO runtime (separate collections, like two models
 * or two sessions). The ONLY thing that crosses from A to B is a file on disk.
 * B reconstructs A's real chain from that file, extends it, and emits its own.
 * Then we verify — mechanically — that B continued A's path and did not fork
 * or fabricate it.
 *
 * Run: node hott/coinference-demo.mjs
 */
import assert from 'node:assert';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { getProps, createTypesCollection } from '../core/module/index.js';
import { emitFromInstance, spineOf } from './lib/pantogram-from-mnemonica.js';
import { reconstruct, sharedSpinePrefix, continues } from './lib/pantogram-coinference.js';

const here = dirname(fileURLToPath(import.meta.url));
const fileA = join(here, 'step-A.pntg');
const fileB = join(here, 'step-B.pntg');

// ───────────────────────────── Agent A ─────────────────────────────
// A builds a real chain in its own collection and writes a .pntg to disk.
const cA = createTypesCollection();
const RequestData = cA.define('RequestData', function (d) { this.id = d.id; });
const reqA = new RequestData({ id: 'req-1' });
const RouteData = RequestData.define('RouteData', function (d) { this.route = d.route; });
const routeA = new reqA.RouteData({ route: '/home' });
const ResponseData = RouteData.define('ResponseData', function (d) { this.status = d.status; });
const respA = new routeA.ResponseData({ status: 200 });

const pntgA = emitFromInstance(respA, getProps);
writeFileSync(fileA, `# emitted by Agent A\n${pntgA}\n`);
const spineA = spineOf(respA, getProps);
console.log('A emits   →', pntgA);

// ═══════════════════ boundary ⥁ : only the file crosses ═══════════════════
// B has no reference to cA, RequestData, respA — nothing. It reads the file.
const received = readFileSync(fileA, 'utf8');

// ───────────────────────────── Agent B ─────────────────────────────
// Fresh collection: B reconstructs A's chain from the text alone, then extends.
const cB = createTypesCollection();
const { instance: rebuilt, type: leafType } = reconstruct(received, cB);

// Fidelity: B's rebuilt lineage equals A's measured spine — across the boundary,
// from text alone, with no shared runtime.
const spineRebuilt = spineOf(rebuilt, getProps);
assert.deepStrictEqual(spineRebuilt, spineA);
console.log('B rebuilt →', emitFromInstance(rebuilt, getProps));

// B continues the path with its own construction step.
leafType.define('RenderData', function (d) { this.frame = d.frame; });
const renderedB = new rebuilt.RenderData({ frame: 1 });
const pntgB = emitFromInstance(renderedB, getProps);
writeFileSync(fileB, `# continued by Agent B from step-A.pntg\n${pntgB}\n`);
const spineB = spineOf(renderedB, getProps);
console.log('B emits   →', pntgB);

// ───────────────────────────── Verify ──────────────────────────────
// 1. B genuinely CONTINUED A's path (A's spine is a prefix of B's).
assert.ok(continues(spineA, spineB), 'B must continue A, not fork it');

// 2. ≋ — the shared component is exactly A's whole lineage.
const shared = sharedSpinePrefix(spineA, spineB);
assert.deepStrictEqual(shared, spineA);

// 3. B added real new structure beyond the shared component.
assert.deepStrictEqual(spineB.slice(shared.length), ['RenderData']);

console.log('\nspine A           :', spineA.join(' → '));
console.log('spine B           :', spineB.join(' → '));
console.log('≋ shared component:', shared.join(' → '));
console.log('B added           :', spineB.slice(shared.length).join(' → '));
console.log('\nCo-inference verified: B continued A across the file boundary with no');
console.log('shared runtime. The path is one connected component — witnessed, not claimed.');
