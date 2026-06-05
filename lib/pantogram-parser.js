/**
 * pantogram-parser.js
 *
 * Parses a .pntg file into an AST that preserves spatial layout.
 * Whitespace is significant — adjacency = connection.
 * Angle brackets ⟨⟩ delimit field values, not standalone glyphs.
 */

const GLYPHS = new Set([
	'◎', '→', '⇄', '↝', '⇝', '⊸', '□',
	'◇', '◆', '⊙', '≋', '≃', '≇', '⥁', '⌀', '∞',
	'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι',
	'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ',
	'τ', 'υ', 'φ', 'χ', 'ψ', 'ω',
	'∘', '↑', '↔', '↻', '⇑', '⇓', '⇴', '∩', '∪', '∖', '∼',
	'□', '·', '…', '–', '—', '‖',
]);

const ARROWS = new Set(['→', '⇄', '↝', '⇝', '⊸', '⥁', '⇴']);

/**
 * Parse Pantogram source into AST nodes with spatial coordinates.
 */
export function parsePantogram(source) {
	const lines = source.split('\n');
	const nodes = [];
	const edges = [];
	const fields = [];

	for (let y = 0; y < lines.length; y++) {
		const line = lines[y];
		let inAngle = false;
		for (let x = 0; x < line.length; x++) {
			const ch = line[x];
			if (ch === '⟨') { inAngle = true; continue; }
			if (ch === '⟩') { inAngle = false; continue; }
			if (inAngle) continue; // skip content inside ⟨⟩
			if (GLYPHS.has(ch)) {
				nodes.push({ glyph: ch, x, y, type: classifyGlyph(ch) });
			}
		}
	}

	// Build edges from adjacency
	for (const node of nodes) {
		const right = nodes.find(n => n.y === node.y && n.x === node.x + 2);
		if (right && !nodeBetween(lines[node.y], node.x + 1)) {
			edges.push({ from: node, to: right, directed: true, type: 'adjacent' });
		}
	}

	// Extract field values from ⟨...⟩
	for (let y = 0; y < lines.length; y++) {
		const line = lines[y];
		// Match ⟨value⟩
		const angleMatch = line.match(/⟨([^⟩]*)⟩/g);
		if (angleMatch) {
			for (const match of angleMatch) {
				const val = match.slice(1, -1);
				const x = line.indexOf(match);
				// Associate with nearest node to the left
				const nearest = nodes
					.filter(n => n.y === y && n.x < x)
					.sort((a, b) => b.x - a.x)[0];
				if (nearest) {
					fields.push({ value: val, x, y, nodeX: nearest.x, nodeY: nearest.y });
				}
			}
		}
	}

	return { nodes, edges, fields, source };
}

function nodeBetween(line, x) {
	const ch = line[x];
	return ch === ' ' || ch === '→' || ch === '—' || ch === '-';
}

function classifyGlyph(ch) {
	if (ARROWS.has(ch)) return 'arrow';
	if (['◎', '□'].includes(ch)) return 'root';
	if (['◇', '◆', '⊙'].includes(ch)) return 'modal';
	if (['≋', '≃', '≇'].includes(ch)) return 'equivalence';
	if (['⥁', '⌀', '∞'].includes(ch)) return 'transform';
	if (['α','β','γ','δ','ε','ζ','η','θ','ι','κ','λ','μ','ν','ξ','ο','π','ρ','σ','τ','υ','φ','χ','ψ','ω'].includes(ch)) return 'mood';
	return 'meta';
}
