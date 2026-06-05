/**
 * selfref-demo.mjs — "inference in inference", honestly.
 *
 * A self-reflective computation: at each step it READS its own measured
 * lineage (getProps spine) and decides the next step from it. Inference
 * consulting its own inference — but MEASURED, not narrated.
 *
 * Because the decision is a pure function of the durable topology (not of
 * ephemeral internal state), the process survives a .pntg boundary and
 * continues identically in a second agent with no shared runtime. That is
 * the dive principle: bind to the durable object, not the ephemeral substrate.
 *
 * It is NOT executed on a model's tensors — those cannot be read and would
 * not survive the boundary anyway. It is executed on real structure, which is
 * the only version that both verifies and survives.
 *
 * Run: node hott/selfref-demo.mjs
 */
import assert from 'node:assert';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { getProps, createTypesCollection } from '../core/module/index.js';
import { emitFromInstance, spineOf } from './lib/pantogram-from-mnemonica.js';
import { reconstruct } from './lib/pantogram-coinference.js';

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, 'selfref-A.pntg');

const body = function (d) { if (d && typeof d === 'object') Object.assign(this, d); };
const kindOf = (t) => t.replace(/\d+$/, '');

// The self-reflective rule: decide the next step by reading the current
// lineage. A pure function of the spine — inference over its own inference.
function decide (spine) {
	const kinds = spine.map(kindOf);
	const acts = kinds.filter((k) => k === 'Act').length;
	const reflects = kinds.filter((k) => k === 'Reflect').length;
	return acts >= (reflects + 1) * 2 ? 'Reflect' : 'Act';
}

// A stepper growing a real mnemonica chain that can read its own topology.
function makeStepper (collection, seed) {
	let type = seed ? seed.type : null;
	let instance = seed ? seed.instance : null;
	return {
		spine () { return instance ? spineOf(instance, getProps) : []; },
		step (kind) {
			const depth = this.spine().length;
			const name = `${kind}${depth + 1}`;
			if (!instance) { type = collection.define(name, body); instance = new type({ i: 1 }); }
			else { type = type.define(name, body); instance = new instance[name]({ i: depth + 1 }); }
		},
		get leaf () { return instance; },
	};
}

function run (stepper, maxDepth) {
	while (stepper.spine().length < maxDepth) {
		stepper.step(decide(stepper.spine())); // reads its own topology, then acts
	}
}

// ── Agent A: self-reflective inference to depth 4, emit measured .pntg ──
const A = makeStepper(createTypesCollection());
run(A, 4);
writeFileSync(file, emitFromInstance(A.leaf, getProps) + '\n');
const spineA = spineOf(A.leaf, getProps).map(kindOf);
console.log('A (depth 4)        :', spineA.join(' → '));

// ── boundary ⥁ : B gets only the file, no shared runtime ──
const seed = reconstruct(readFileSync(file, 'utf8'), createTypesCollection());
const B = makeStepper(createTypesCollection(), seed);
run(B, 8); // B continues the SAME rule, reading the reconstructed topology
const spineB = spineOf(B.leaf, getProps).map(kindOf);
console.log('B (continued to 8) :', spineB.join(' → '));

// Ground truth: one uninterrupted self-reflective run to depth 8.
const R = makeStepper(createTypesCollection());
run(R, 8);
const spineRef = spineOf(R.leaf, getProps).map(kindOf);
console.log('continuous (to 8)  :', spineRef.join(' → '));

// The split A|B inference == the continuous one. The boundary is invisible
// to the computation because it reasons over durable structure.
assert.deepStrictEqual(spineB, spineRef);
assert.deepStrictEqual(spineB.slice(0, 4), spineA);

console.log('\nSplit A|B reproduces the continuous self-reflective run, exactly.');
console.log('The inference reads its OWN measured topology to choose each step, so it');
console.log('survives the .pntg boundary and another agent continues it identically —');
console.log('not on tensors (those do not cross), on structure (which does).');
