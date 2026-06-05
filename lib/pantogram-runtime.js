/**
 * pantogram-runtime.js
 *
 * Executes a parsed Pantogram AST as a runtime object graph.
 * Each node becomes a field on a decorated object.
 * Edges become prototype chain links or reference fields.
 */

/**
 * FieldConstructor — the primitive glyph cell.
 * Immutable structure, mutable value through Symbol.
 */
export class FieldConstructor {
	static SymbolValue = Symbol('FieldValue');
	static SymbolType = Symbol('FieldType');

	constructor(value, type = 'unknown') {
		this[FieldConstructor.SymbolValue] = value;
		this[FieldConstructor.SymbolType] = type;
		Object.freeze(this);
	}

	get() {
		return this[FieldConstructor.SymbolValue];
	}

	set(v) {
		// Type-locked: only same type or 'any'
		if (this[FieldConstructor.SymbolType] !== 'any' && typeof v !== this[FieldConstructor.SymbolType]) {
			throw new TypeError(`Type mismatch: expected ${this[FieldConstructor.SymbolType]}, got ${typeof v}`);
		}
		this[FieldConstructor.SymbolValue] = v;
		return this;
	}

	toString() {
		return String(this[FieldConstructor.SymbolValue]);
	}
}

/**
 * PantogramNode — a runtime object representing one Pantogram position.
 */
export class PantogramNode {
	constructor(glyph, x, y) {
		this.glyph = glyph;
		this.x = x;
		this.y = y;
		this.fields = Object.create(null);
		this.edges = [];
		this.parent = null;
	}

	setField(name, value, type = 'any') {
		this.fields[name] = new FieldConstructor(value, type);
	}

	getField(name) {
		// Walk prototype-like chain through parent
		if (this.fields[name]) return this.fields[name];
		if (this.parent) return this.parent.getField(name);
		return undefined;
	}

	linkTo(other, directed = true) {
		this.edges.push({ target: other, directed });
	}

	/**
	 * Extract the mood/topology of this node and its chain.
	 */
	topology() {
		const result = {
			glyph: this.glyph,
			position: [this.x, this.y],
			fields: {},
			children: this.edges.map(e => e.target.topology()),
		};
		for (const [k, v] of Object.entries(this.fields)) {
			result.fields[k] = v.get();
		}
		return result;
	}
}

/**
 * Execute the AST: build a runtime graph of PantogramNodes.
 */
export function executeTopology(ast) {
	const { nodes, edges, fields } = ast;

	// Create PantogramNode for each AST node
	const nodeMap = new Map();
	for (const n of nodes) {
		const runtimeNode = new PantogramNode(n.glyph, n.x, n.y);
		nodeMap.set(nodeKey(n.x, n.y), runtimeNode);
	}

	// Wire edges
	for (const e of edges) {
		const fromNode = nodeMap.get(nodeKey(e.from.x, e.from.y));
		const toNode = nodeMap.get(nodeKey(e.to.x, e.to.y));
		if (fromNode && toNode) {
			fromNode.linkTo(toNode, e.directed);
			if (!e.directed) {
				toNode.linkTo(fromNode, false);
			}
			// Prototype-like parent for directed edges (child inherits from parent)
			if (e.directed && ['→', '⊸', '⥁'].includes(e.from.glyph)) {
				toNode.parent = fromNode;
			}
		}
	}

	// Attach field values
	for (const f of fields) {
		// Find nearest node to this field position
		let nearest = null;
		let nearestDist = Infinity;
		for (const n of nodes) {
			const dx = n.x - (f.x || 0);
			const dy = n.y - (f.y || 0);
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist < nearestDist) {
				nearestDist = dist;
				nearest = n;
			}
		}
		if (nearest) {
			const rnode = nodeMap.get(nodeKey(nearest.x, nearest.y));
			const name = f.name || 'value';
			rnode.setField(name, f.value, typeof f.value);
		}
	}

	// Find root nodes (no parents)
	const roots = [];
	for (const n of nodeMap.values()) {
		if (!n.parent) roots.push(n);
	}

	return { roots, nodes: Array.from(nodeMap.values()), ast };
}

function nodeKey(x, y) {
	return `${x},${y}`;
}
