#!/usr/bin/env node
/**
 * session.js — Pantogram Session Executor
 *
 * Usage:
 *   node ./session.js ./session_result.pntg
 *   node ./session.js ./session_result.pntg --mood-only
 *
 * Reads a Pantogram topology file, executes it as a runtime object graph,
 * and emits the resulting mood/topology as spatial Pantogram to stdout.
 */

import { readFileSync } from 'fs';
import { parsePantogram } from './lib/pantogram-parser.js';
import { executeTopology } from './lib/pantogram-runtime.js';
import { emitTopology, emitMood } from './lib/pantogram-emitter.js';

const filePath = process.argv[2];
const moodOnly = process.argv.includes('--mood-only');

if (!filePath) {
	console.error('Usage: node ./session.js <session.pntg> [--mood-only]');
	process.exit(1);
}

const source = readFileSync(filePath, 'utf8');
const ast = parsePantogram(source);
const runtime = executeTopology(ast);

if (moodOnly) {
	console.log(emitMood(runtime));
} else {
	console.log(emitTopology(runtime));
}
