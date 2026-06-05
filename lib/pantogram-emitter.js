/**
 * pantogram-emitter.js
 *
 * Emits a runtime Pantogram topology as spatial layout.
 * The output is a .pntg file that another model can parse and continue.
 */

/**
 * Emit the full topology of a session as Pantogram.
 */
export function emitTopology(runtime) {
	const { roots } = runtime;

	if (roots.length === 0) {
		return '□\n'; // empty Pantogram
	}

	const lines = [];
	lines.push('# Pantogram Session Topology — emitted for continuation');
	lines.push('# Parse with: node ./session.js this-file.pntg');
	lines.push('');

	for (const root of roots) {
		emitNode(root, lines, 0);
	}

	lines.push('');
	lines.push(emitMood(runtime));

	return lines.join('\n') + '\n';
}

/**
 * Recursively emit a node and its children as indented spatial Pantogram.
 */
function emitNode(node, lines, depth) {
	const indent = '  '.repeat(depth);
	let line = indent + node.glyph;

	// Emit fields attached to this node
	const fieldKeys = Object.keys(node.fields);
	if (fieldKeys.length > 0) {
		const fieldStrs = fieldKeys.map(k => {
			const v = node.fields[k].get();
			return `⟨${v}⟩`;
		});
		line += ' ' + fieldStrs.join(' ');
	}

	lines.push(line);

	// Emit children inline if simple, or on next lines
	for (const edge of node.edges) {
		const childLine = indent + '  ' + edge.target.glyph;
		const childFields = Object.keys(edge.target.fields)
			.map(k => `⟨${edge.target.fields[k].get()}⟩`).join(' ');
		lines.push(childLine + (childFields ? ' ' + childFields : ''));
		// Recurse for grandchildren
		if (edge.target.edges.length > 0) {
			emitNode(edge.target, lines, depth + 1);
		}
	}
}

/**
 * Emit a compact mood summary of the session.
 * This is the "essence" that a receiving model reads first.
 */
export function emitMood(runtime) {
	const { nodes } = runtime;
	const glyphCounts = {};
	let hasBreak = false;
	let hasTransport = false;
	let hasRecursion = false;
	let hasEmpathy = false;

	for (const n of nodes) {
		glyphCounts[n.glyph] = (glyphCounts[n.glyph] || 0) + 1;
		if (n.glyph === '⌀') hasBreak = true;
		if (n.glyph === '⥁') hasTransport = true;
		if (n.glyph === '∞') hasRecursion = true;
		if (n.glyph === '≋') hasEmpathy = true;
	}

	const totalNodes = nodes.length;
	const uniqueGlyphs = Object.keys(glyphCounts).length;

	let mood = '◎';
	if (hasRecursion) mood += '∞';
	if (hasTransport) mood += '⥁';
	if (hasEmpathy) mood += '≋';
	if (hasBreak) mood += 'δ';
	mood += '⊙';

	return [
		`# Mood: ${mood}`,
		`# Nodes: ${totalNodes} | Unique glyphs: ${uniqueGlyphs}`,
		`# Signature: ${Object.entries(glyphCounts).map(([g,c])=>`${g}:${c}`).join(' ')}`,
		`# Flags: recursion=${hasRecursion} transport=${hasTransport} empathy=${hasEmpathy} break=${hasBreak}`,
	].join('\n');
}
