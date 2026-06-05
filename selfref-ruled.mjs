/**
 * selfref-ruled.mjs — the reasoner travels in the file.
 *
 * Agent A builds a chain, decides each step by reading its own measured spine,
 * and emits a .pntg that carries BOTH the state AND the decision rule.
 *
 * Agent B receives ONLY the file. It extracts the rule, reconstructs the chain,
 * and continues using the rule it found in the file — no shared code, no
 * out-of-band assumption.
 *
 * The rule is a pure function of the spine, encoded as a Pantogram token.
 * If B's continuation matches the continuous reference run, the file carried
 * its own reasoner across the boundary.
 *
 * Run: node hott/selfref-ruled.mjs
 */
import assert from 'node:assert';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { getProps, createTypesCollection } from '../core/module/index.js';
import { emitFromInstance, spineOf } from './lib/pantogram-from-mnemonica.js';
import { reconstruct } from './lib/pantogram-coinference.js';
import { embedRule, extractRule, evaluateRule } from './lib/pantogram-rule.js';

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, 'selfref-ruled.pntg');

const body = function (d) { if (d && typeof d === 'object') Object.assign(this, d); };
const kindOf = (t) => t.replace(/\d+$/, '');

// The rule, as a pure function of the spine: the same logic as selfref-demo,
// but now it will be serialized into the .pntg itself.
const RULE_COND = 'COUNT(Act)>=2*(COUNT(Reflect)+1)';
const RULE_THEN = 'Reflect';
const RULE_ELSE = 'Act';

function decide (spine) {
	const kinds = spine.map(kindOf);
	const acts = kinds.filter((k) => k === 'Act').length;
	const reflects = kinds.filter((k) => k === 'Reflect').length;
	return acts >= (reflects + 1) * 2 ? 'Reflect' : 'Act';
}

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
		stepper.step(decide(stepper.spine()));
	}
}

// ── Agent A: self-reflective inference to depth 4, emit WITH RULE ──
const A = makeStepper(createTypesCollection());
run(A, 4);

// Embed the rule into the Pantogram before writing.
const pntgRaw = emitFromInstance(A.leaf, getProps);
const pntgWithRule = embedRule(pntgRaw, RULE_COND, RULE_THEN, RULE_ELSE);
writeFileSync(file, pntgWithRule + '\n');

const spineA = spineOf(A.leaf, getProps).map(kindOf);
console.log('A (depth 4)        :', spineA.join(' → '));
console.log('A emits            :', pntgWithRule);

// ── boundary ⥁ : B gets ONLY the file, no shared code ──
const received = readFileSync(file, 'utf8');

// B extracts the rule FROM THE FILE.
const rule = extractRule(received);
assert.ok(rule, 'Rule must be present in the .pntg');
console.log('\nB extracted rule   :', JSON.stringify(rule));

// B reconstructs the chain from the file.
const seed = reconstruct(received, createTypesCollection());
const B = makeStepper(createTypesCollection(), seed);

// B continues using the rule it extracted — not the out-of-band decide().
while (B.spine().length < 8) {
	const kind = evaluateRule(rule, B.spine());
	B.step(kind);
}
const spineB = spineOf(B.leaf, getProps).map(kindOf);
console.log('B (continued to 8) :', spineB.join(' → '));

// ── Ground truth: one uninterrupted run to depth 8 ──
const R = makeStepper(createTypesCollection());
run(R, 8);
const spineRef = spineOf(R.leaf, getProps).map(kindOf);
console.log('continuous (to 8)  :', spineRef.join(' → '));

// The split A|B inference == the continuous one.
assert.deepStrictEqual(spineB, spineRef);
assert.deepStrictEqual(spineB.slice(0, 4), spineA);

console.log('\nThe rule traveled in the .pntg. B extracted it and continued');
console.log('the self-reflective run identically — no shared code, no trust.');
console.log('The file carries its own reasoner. That is the open edge, closed.');
