/**
 * operational-guarded.mjs — conditional seeding: trust the prior only when
 * the shared prefix is long enough to be useful.  Builds on operational-demo.
 *
 * The insight from the edge-case matrix: a short or zero-length shared prefix
 * can mislead (first-char mismatch makes seeded slower than cold).  So we
 * gate: only seed when sharedSpinePrefix meets a threshold.
 *
 * Run: node hott/operational-guarded.mjs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { getProps, createTypesCollection } from '../core/module/index.js';
import { emitFromInstance } from './lib/pantogram-from-mnemonica.js';
import { parseSpine, sharedSpinePrefix } from './lib/pantogram-coinference.js';

const here = dirname(fileURLToPath(import.meta.url));
const ALPHABET = ['A', 'B', 'C'];

// ── same helpers as operational-demo ──
function search(target, bias) {
	let explored = 0;
	const dfs = (prefix) => {
		if (prefix.length === target.length) {
			explored++;
			return prefix.join('') === target.join('');
		}
		const first = bias ? bias[prefix.length] : null;
		const order = first ? [first, ...ALPHABET.filter((s) => s !== first)] : ALPHABET;
		for (const s of order) {
			if (dfs([...prefix, s])) return true;
		}
		return false;
	};
	dfs([]);
	return explored;
}

function buildChain(seq) {
	const c = createTypesCollection();
	let type = null, inst = null, parent = null;
	seq.forEach((sym, i) => {
		const body = function (d) { Object.assign(this, d); };
		const name = `Step${i}`;
		if (!parent) { type = c.define(name, body); inst = new type({ sym }); }
		else { type = type.define(name, body); inst = new parent[name]({ sym }); }
		parent = inst;
	});
	const pntg = emitFromInstance(inst, getProps);
	return parseSpine(pntg).map((s) => s.arg.sym);
}

// ── conditional seeding: only trust the prior when the shared prefix is useful ──
function guardedSearch(target, recovered, threshold = 1) {
	const shared = sharedSpinePrefix(recovered, target);
	if (shared.length < threshold) {
		// Not enough shared essence — the prior would mislead more than help.
		return { mode: 'cold', explored: search(target, null), shared };
	}
	return { mode: 'seeded', explored: search(target, recovered), shared };
}

function report(label, priorSeq, targetSeq, threshold = 1) {
	const recovered = buildChain(priorSeq);
	const cold = search(targetSeq, null);
	const guarded = guardedSearch(targetSeq, recovered, threshold);
	const ratio = guarded.explored === 0 ? '∞' : (cold / guarded.explored).toFixed(1) + '×';

	console.log(`\n--- ${label} ---`);
	console.log(`prior     : ${recovered.join('')}`);
	console.log(`target    : ${targetSeq.join('')}`);
	console.log(`shared    : ${guarded.shared.join('') || '(none)'} (${guarded.shared.length}/${targetSeq.length})`);
	console.log(`threshold : ${threshold}`);
	console.log(`mode      : ${guarded.mode}`);
	console.log(`cold=${cold}  guarded=${guarded.explored}  speedup=${ratio}`);
	return { cold, guarded, recovered };
}

// ── Prior session (same as operational-demo) ──
const priorSeq = ['B', 'A', 'C', 'A', 'B', 'A'];
const recovered = buildChain(priorSeq);
const priorPntg = emitFromInstance(
	(function () {
		const c = createTypesCollection();
		let type = null, inst = null, parent = null;
		priorSeq.forEach((sym, i) => {
			const body = function (d) { Object.assign(this, d); };
			const name = `Step${i}`;
			if (!parent) { type = c.define(name, body); inst = new type({ sym }); }
			else { type = type.define(name, body); inst = new parent[name]({ sym }); }
			parent = inst;
		});
		return inst;
	})(),
	getProps
);
writeFileSync(join(here, 'prior.pntg'), priorPntg + '\n');

console.log('=== operational-guarded: conditional seeding ===');
console.log('\nThe threshold says: only seed when shared prefix >= N.');
console.log('With threshold=1 we allow any non-empty prefix.');
console.log('With threshold=2 we require at least 2 shared symbols.');

// ── Case A: original demo target (shares BAC) ──
report('demo target (shares BAC)', priorSeq, ['B', 'A', 'C', 'C', 'A', 'B'], 1);

// ── Case B: first-char mismatch — seeded is harmful ──
report('first-char mismatch', priorSeq, ['A', 'B', 'C', 'A', 'B', 'A'], 1);
report('first-char mismatch (threshold=2)', priorSeq, ['A', 'B', 'C', 'A', 'B', 'A'], 2);

// ── Case C: exact match ──
report('exact match', priorSeq, priorSeq, 1);

// ── Case D: no overlap at all ──
report('no overlap', priorSeq, ['C', 'C', 'C', 'C', 'C', 'C'], 1);
report('no overlap (threshold=2)', priorSeq, ['C', 'C', 'C', 'C', 'C', 'C'], 2);

// ── Summary ──
console.log('\n=== Result ===');
console.log('When threshold=1, a 1-char shared prefix can still mislead.');
console.log('When threshold=2, first-char mismatch falls back to cold — no harm.');
console.log('The guard makes ≋ operational: shared essence is not binary,');
console.log('it is a continuous quantity (prefix length) that gates transfer.');
