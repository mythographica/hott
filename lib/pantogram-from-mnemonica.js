/**
 * pantogram-from-mnemonica.js
 *
 * Grounded emitter: render a Pantogram from a REAL mnemonica instance,
 * read off its actual construction lineage via getProps — not narrated.
 *
 * This is the load-bearing brick of the whole hott/ side-car: it makes
 * "the instance IS the path, topology is the meaning" literally true for
 * the one case where a real topology exists — a constructed mnemonica chain.
 *
 * The lineage is MEASURED (walk __parent__ to the Mnemosyne root), so the
 * resulting .pntg is a faithful projection of runtime structure. It cannot
 * be fabricated independently of the object it describes — which is exactly
 * the property INFERENCE-CATCH-22 wanted but could not get from self-report.
 *
 * `getProps` is injected (dependency-free lib): pass mnemonica's getProps.
 */

/**
 * Walk an instance's real construction lineage, root-first.
 * Stops at the Mnemosyne root (getProps(...) === undefined).
 *
 * @returns Array<{ type, args, timestamp }> ordered root → leaf.
 */
export function lineageOf (instance, getProps) {
	const chain = [];
	let cur = instance;
	while (cur) {
		const props = getProps(cur);
		if (!props || !props.__type__) {
			break; // hit the Mnemosyne root or a non-instance
		}
		chain.push({
			type      : props.__type__.TypeName,
			args      : props.__args__,
			timestamp : props.__timestamp__,
		});
		cur = props.__parent__;
	}
	return chain.reverse();
}

function renderArg (arg) {
	if (arg === undefined) return '';
	if (arg === null) return 'null';
	if (typeof arg === 'object') {
		try {
			const s = JSON.stringify(arg);
			return s.length > 40 ? s.slice(0, 39) + '…' : s;
		} catch {
			return String(arg);
		}
	}
	return String(arg);
}

/**
 * Emit a single-line Pantogram for a real mnemonica instance:
 *
 *   ◎ ⊸ ⟨RequestData⟩ ⟨{"id":"req-1"}⟩ → ⟨RouteData⟩ → ⟨ResponseData⟩ ⊙
 *
 * ◎ = the root vantage, ⊸ = the first monadic bind (root → first type),
 * → = each subsequent construction step, ⊙ = the witnessed leaf instance.
 */
export function emitFromInstance (instance, getProps) {
	const chain = lineageOf(instance, getProps);
	if (chain.length === 0) {
		return '□'; // unit: a bare value, no witnessed lineage
	}
	const parts = ['◎'];
	chain.forEach((step, i) => {
		const fiber = renderArg(step.args && step.args[0]);
		parts.push(i === 0 ? '⊸' : '→');
		parts.push(`⟨${step.type}⟩${fiber ? ` ⟨${fiber}⟩` : ''}`);
	});
	parts.push('⊙');
	return parts.join(' ');
}

/**
 * The type-name spine only — the verifiable invariant. Two emits are
 * "the same path" iff their spines match. This is what a receiving model
 * (or a test) checks: structure, not prose.
 */
export function spineOf (instance, getProps) {
	return lineageOf(instance, getProps).map((s) => s.type);
}
