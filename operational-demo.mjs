/**
 * operational-demo.mjs — does a prior session's Pantogram make the NEXT
 * reasoner reach the essence faster?  Measured, not asserted.
 *
 * Task: a "combination" of length K over a small alphabet. The goal is only
 * recognizable when complete (you can't tell mid-way if you're right) — so a
 * cold reasoner must search. We measure candidates explored to reach the goal.
 *
 *   Prior session solves task A, emits prior.pntg (a REAL mnemonica chain).
 *   New, RELATED task B (shares the essence prefix) is solved two ways:
 *     - cold   : no prior, fixed search order
 *     - seeded : recover the prior's shape from prior.pntg, try it first
 *
 * The seeded reasoner's speedup comes entirely from the shared prefix — the ≋
 * of the two tasks. ≋ is the transfer mechanism: shared essence = less search.
 *
 * Run: node hott/operational-demo.mjs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { getProps, createTypesCollection } from '../core/module/index.js';
import { emitFromInstance } from './lib/pantogram-from-mnemonica.js';
import { parseSpine, sharedSpinePrefix } from './lib/pantogram-coinference.js';

const here = dirname(fileURLToPath(import.meta.url));
const ALPHABET = ['A', 'B', 'C'];

// ── Prior session (A): solved this combination; emit it as a real .pntg ──
const priorSeq = ['B', 'A', 'C', 'A', 'B', 'A'];
const cA = createTypesCollection();
let type = null;
let inst = null;
let parent = null;
priorSeq.forEach((sym, i) => {
	const body = function (d) { Object.assign(this, d); };
	const name = `Step${i}`;
	if (!parent) { type = cA.define(name, body); inst = new type({ sym }); }
	else { type = type.define(name, body); inst = new parent[name]({ sym }); }
	parent = inst;
});
const priorPntg = emitFromInstance(inst, getProps);
writeFileSync(join(here, 'prior.pntg'), priorPntg + '\n');

// The next reasoner gets ONLY the file. Recover the prior's shape from it.
const recovered = parseSpine(priorPntg).map((s) => s.arg.sym);

// ── A new, RELATED task B (shares the essence prefix B-A-C) ──
const targetB = ['B', 'A', 'C', 'C', 'A', 'B'];

// Search: build the combination; the goal is only checkable when complete.
// `bias` (optional) gives the symbol to try FIRST at each position.
function search (target, bias) {
	let explored = 0;
	const dfs = (prefix) => {
		if (prefix.length === target.length) {
			explored++; // a full candidate evaluated
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

const cold = search(targetB, null);
const seeded = search(targetB, recovered);
const shared = sharedSpinePrefix(recovered, targetB);

console.log('prior.pntg shape  :', recovered.join(''));
console.log('new task B (goal) :', targetB.join(''));
console.log('≋ shared essence  :', shared.join('') || '(none)', `(${shared.length}/${targetB.length})`);
console.log('');
console.log('candidates explored — cold   :', cold);
console.log('candidates explored — seeded :', seeded);
console.log('speedup                       :', (cold / seeded).toFixed(1) + '×');
console.log('');
console.log('The seeded reasoner reaches the essence faster ENTIRELY because of the');
console.log('shared prefix it recovered from prior.pntg. ≋ (shared essence) = less search.');
console.log('Cold = no prior; seeded = next-session/other-model standing on the .pntg.');
