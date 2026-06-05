/**
 * ground-demo.mjs — Pantogram grounded in a REAL mnemonica instance.
 *
 * Builds an actual construction chain, emits its Pantogram from getProps,
 * and proves the glyphs are a faithful projection of runtime structure:
 *   1. the emitted spine == the lineage measured from the live object
 *   2. it round-trips through the existing parser
 *   3. a different construction yields a different Pantogram (no template)
 *
 * Run: node hott/ground-demo.mjs
 */
import assert from 'node:assert';
import { getProps, createTypesCollection } from '../core/module/index.js';
import { emitFromInstance, spineOf } from './lib/pantogram-from-mnemonica.js';
import { parsePantogram } from './lib/pantogram-parser.js';

// Isolated collection (don't touch defaultTypes' global counters).
const c = createTypesCollection();

// The canonical pipeline from the mnemonica docs: each step's prototype
// IS the previous instance (line-96 graft), so the lineage is real.
const RequestData = c.define('RequestData', function (d) { this.id = d.id; });
const req = new RequestData({ id: 'req-1' });

const RouteData = RequestData.define('RouteData', function (d) { this.route = d.route; });
const route = new req.RouteData({ route: '/home' });

const ResponseData = RouteData.define('ResponseData', function (d) { this.status = d.status; });
const resp = new route.ResponseData({ status: 200 });

// A divergent leaf off the SAME route — different real construction.
const ErrorData = RouteData.define('ErrorData', function (d) { this.error = d.error; });
const err = new route.ErrorData({ error: 'boom' });

const pantoOK = emitFromInstance(resp, getProps);
const pantoErr = emitFromInstance(err, getProps);

console.log('success path :', pantoOK);
console.log('error path   :', pantoErr);

// 1. Spine == measured lineage (ground truth = the order I actually built).
assert.deepStrictEqual(spineOf(resp, getProps), ['RequestData', 'RouteData', 'ResponseData']);
assert.deepStrictEqual(spineOf(err, getProps), ['RequestData', 'RouteData', 'ErrorData']);

// 2. Round-trips through the existing parser: the type names survive
//    serialization and come back in order.
const parsed = parsePantogram(pantoOK);
const recovered = parsed.fields
	.map((f) => f.value)
	.filter((v) => ['RequestData', 'RouteData', 'ResponseData'].includes(v));
assert.deepStrictEqual(recovered, ['RequestData', 'RouteData', 'ResponseData']);

// 3. The two Pantograms share the witnessed prefix and diverge exactly at
//    the leaf — because they ARE different constructions, not templates.
assert.notStrictEqual(pantoOK, pantoErr);
assert.ok(pantoOK.includes('⟨RouteData⟩') && pantoErr.includes('⟨RouteData⟩'));
assert.ok(pantoOK.includes('⟨ResponseData⟩') && !pantoErr.includes('⟨ResponseData⟩'));

// 4. The fiber (constructor args) is carried, not invented.
assert.ok(pantoOK.includes('⟨{"id":"req-1"}⟩'));
assert.ok(pantoOK.includes('⟨{"status":200}⟩'));

console.log('\nspine(resp) :', spineOf(resp, getProps).join(' → '));
console.log('spine(err)  :', spineOf(err, getProps).join(' → '));
console.log('\nAll assertions passed — the Pantogram is measured from the live instance,');
console.log('not narrated. Topology = the object, witnessed.');
