/**
 * pantogram-rule.js
 *
 * Minimal rule DSL for self-continuing Pantograms.
 * A rule is a pure function of the spine that decides the next step kind.
 *
 * Syntax (inside ⟨⟩):
 *   ⟨rule:COUNT(kind) op EXPR?THEN:ELSE⟩
 *
 * Where:
 *   COUNT(kind)  = number of spine items whose kind matches
 *   EXPR         = arithmetic expression with + - * / and COUNT(kind)
 *   op           = >= <= > < ==
 *   THEN, ELSE   = literal strings (the kind to choose)
 *
 * Example — the self-ref rule:
 *   ⟨rule:COUNT(Act)>=2*(COUNT(Reflect)+1)?Reflect:Act⟩
 *
 * This is intentionally tiny. The goal is not a full language.
 * The goal is: one file carries both state AND the reasoner.
 */

const RULE_RE = /^COUNT\(([^)]+)\)\s*(>=|<=|>||<|==)\s*(.+?)\?(.+?):(.+)$/;

function kindOf(t) {
	return String(t).replace(/\d+$/, '');
}

function countKind(spine, kind) {
	return spine.filter((s) => kindOf(s) === kind).length;
}

function evalExpr(expr, spine) {
	// Replace COUNT(K) with actual counts, then safe-eval the arithmetic
	let replaced = expr;
	const counts = [...expr.matchAll(/COUNT\(([^)]+)\)/g)];
	for (const m of counts) {
		replaced = replaced.replace(m[0], String(countKind(spine, m[1])));
	}
	// Only allow digits, spaces, + - * / ( )
	if (!/^[\d\s+\-*/()]+$/.test(replaced)) {
		throw new Error(`Invalid expression: ${expr}`);
	}
	// eslint-disable-next-line no-new-func
	return Number(new Function(`return (${replaced})`)());
}

/**
 * Encode a rule as a Pantogram token string (without the outer ⟨⟩).
 */
export function encodeRule(conditionExpr, thenKind, elseKind) {
	return `rule:${conditionExpr}?${thenKind}:${elseKind}`;
}

/**
 * Decode a raw token (with or without rule: prefix) into a rule object.
 */
export function decodeRule(token) {
	const raw = token.startsWith('rule:') ? token.slice(5) : token;
	const m = raw.match(RULE_RE);
	if (!m) return null;
	return {
		countKind   : m[1],
		op          : m[2],
		expr        : m[3],
		thenKind    : m[4],
		elseKind    : m[5],
	};
}

function compare(a, op, b) {
	switch (op) {
		case '>=': return a >= b;
		case '<=': return a <= b;
		case '>':  return a > b;
		case '<':  return a < b;
		case '==': return a === b;
		default:   throw new Error(`Unknown op: ${op}`);
	}
}

/**
 * Evaluate a decoded rule against a spine (array of type names).
 * Returns the chosen kind string.
 */
export function evaluateRule(rule, spine) {
	if (!rule) throw new Error('No rule provided');
	const lhs = countKind(spine, rule.countKind);
	const rhs = evalExpr(rule.expr, spine);
	return compare(lhs, rule.op, rhs) ? rule.thenKind : rule.elseKind;
}

/**
 * Extract a rule token from a full Pantogram string.
 */
export function extractRule(pntgText) {
	const m = pntgText.match(/⟨rule:([^⟩]+)⟩/);
	if (!m) return null;
	return decodeRule(m[1]);
}

/**
 * Embed a rule into a Pantogram string (inserts before ⊙).
 */
export function embedRule(pntgText, conditionExpr, thenKind, elseKind) {
	const token = encodeRule(conditionExpr, thenKind, elseKind);
	return pntgText.replace(/ ⊙$/, ` ⟨${token}⟩ ⊙`);
}

/**
 * Convenience: one-shot from raw token string.
 */
export function decideFromToken(token, spine) {
	const rule = decodeRule(token);
	if (!rule) throw new Error(`Not a rule token: ${token}`);
	return evaluateRule(rule, spine);
}
