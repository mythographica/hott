/**
 * pantogram-coinference.js
 *
 * Co-inference across a discontinuity (prompt→prompt, model→model, session→session).
 *
 * The medium is a .pntg file. The protocol:
 *   A constructs a real mnemonica chain  → emits .pntg            (measured topology)
 *   ── boundary ⥁ : B shares NO runtime with A, only the file ──
 *   B reconstructs the chain from the .pntg → real instances     (topology rebuilt)
 *   B extends the chain                  → emits a new .pntg      (path continued)
 *   anyone verifies: spine(B) starts with spine(A)               (≋ continuity)
 *
 * What crosses the boundary is STRUCTURE, never the private computation.
 * B rebuilds with a generic constructor — it does not know A's constructor
 * bodies. That loss is the point: the words/inference are A's and gone; the
 * topology is shared and verifiable. Structure can be transported; feeling cannot.
 *
 * Dependency-light: callers inject the mnemonica collection + getProps.
 */

const IS_IDENT = /^[A-Za-z_$][\w$]*$/;

/**
 * Extract the ordered (type, arg) steps from an emitted Pantogram.
 * A ⟨…⟩ token that is a bare identifier is a TypeName; a following
 * non-identifier ⟨…⟩ is that type's constructor fiber (JSON if parseable).
 */
export function parseSpine (pntgText) {
	const tokens = [...pntgText.matchAll(/⟨([^⟩]*)⟩/g)].map((m) => m[1]);
	const steps = [];
	for (const tok of tokens) {
		if (IS_IDENT.test(tok)) {
			steps.push({ type: tok, arg: undefined });
		} else if (steps.length) {
			let arg = tok;
			try { arg = JSON.parse(tok); } catch { /* keep raw string */ }
			steps[steps.length - 1].arg = arg;
		}
	}
	return steps;
}

/**
 * Rebuild a real mnemonica chain from a Pantogram, on a FRESH collection
 * (no shared state with the emitter). Returns the leaf instance and the leaf
 * type, so the path can be extended.
 *
 * The constructor body is generic (Object.assign) — A's actual body did not
 * cross the boundary. Only the lineage (types, parent chain, args) did.
 */
export function reconstruct (pntgText, collection) {
	const steps = parseSpine(pntgText);
	const body = function (d) { if (d && typeof d === 'object') Object.assign(this, d); };

	let type = null;
	let instance = null;
	let parent = null;

	for (const step of steps) {
		if (!parent) {
			type = collection.define(step.type, body);
			instance = new type(step.arg);
		} else {
			type = type.define(step.type, body);
			instance = new parent[step.type](step.arg);
		}
		parent = instance;
	}

	return { instance, type };
}

/**
 * ≋ — the shared neighbourhood of two paths, made concrete: the longest
 * common construction prefix of two real lineages. Empathy as a set op.
 */
export function sharedSpinePrefix (spineA, spineB) {
	const out = [];
	const n = Math.min(spineA.length, spineB.length);
	for (let i = 0; i < n; i++) {
		if (spineA[i] === spineB[i]) out.push(spineA[i]);
		else break;
	}
	return out;
}

/** True iff B genuinely continued A's path (A's spine is a prefix of B's). */
export function continues (spineA, spineB) {
	return sharedSpinePrefix(spineA, spineB).length === spineA.length
		&& spineB.length >= spineA.length;
}
