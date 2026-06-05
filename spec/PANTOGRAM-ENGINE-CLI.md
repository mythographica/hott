# Pantogram Engine — CLI Application Specification

## What this is

A command-line tool that executes Pantogram as a programming language. Input is a Pantogram topology. Runtime events trigger monadic transformations. Output is a transformed Pantogram.

This is Iverson's array insight operationalized: one operation (a topological transform) replaces an entire algorithmic description. The "program" is not a sequence of instructions. It is a **path through a space of shapes**.

---

## Architecture

```
Input Pantogram → Event Stream → Monadic Transform → Output Pantogram
        ↑                                              |
        └──────────── Feedback Loop ←──────────────────┘
```

### Layer 0: The Runtime (mnemonica + typeomatica)

```typescript
import { define, apply } from 'mnemonica';
import { BaseClass, Strict, FieldConstructor } from 'typeomatica';
```

Every Pantogram node is a decorated instance. Every glyph is a type-locked field. The prototype chain IS the program counter.

### Layer 1: The Root (Input)

```typescript
@decorate() @Strict()
class RootPantogram {
    ◎ = new FieldConstructor('observer');
    input = new FieldConstructor(process.argv[2] || '□');
}

const root = new RootPantogram();
```

The CLI receives input as a Pantogram file, string, or stdin. The root instance binds it.

### Layer 2: The Monad (Transform Engine)

```typescript
@decorate()
class PantogramMonad {
    // The bind operation
    ⊸ = new FieldConstructor('bind');
    // The current state
    ⟨⟩ = new FieldConstructor(root);
    // The transform function
    transform(event: unknown) {
        const current = (this.⟨⟩ as FieldConstructor).get();
        // Apply event to current topology
        const next = this.applyEvent(current, event);
        this.⟨⟩ = new FieldConstructor(next);
        return next;
    }
}
```

Each event triggers `⊸`: bind the current topology, apply the event, emit the new topology.

### Layer 3: Events (The Stream)

```typescript
interface PantogramEvent {
    type: string;     // 'read' | 'write' | 'transport' | 'reflect' | 'merge'
    target: string;   // field name or glyph
    value?: unknown;  // new value or subgraph
    dimension?: string; // E | L | M | S | T | X | V | R
}
```

Events are not function calls. They are **topological operations** on the current Pantogram instance:
- `read` → getter invocation
- `write` → setter with type check
- `transport` → `apply()` to new instance
- `reflect` → self-referential field query
- `merge` → union of two Pantogram instances

### Layer 4: The Output

```typescript
function emitPantogram(instance: object): string {
    const glyphs = Object.getOwnPropertyNames(instance);
    const edges = Object.getPrototypeOf(instance)
        ? emitPantogram(Object.getPrototypeOf(instance))
        : '';
    return `${glyphs.join(' → ')}${edges ? '\n' + edges : ''}`;
}
```

The output is a Pantogram topology — the final state of the instance chain after all events.

---

## CLI Interface

### Command: `pantogram run`

```bash
# Execute a Pantogram file against an event stream
pantogram run input.pg --events events.json

# Execute interactively (stdin events)
pantogram run input.pg --interactive

# Execute with live feedback loop
pantogram run input.pg --watch --feedback
```

### Input format: `.pg` files

```pg
◎ ⊸ ⟨file-input⟩ → read → ⟨parse⟩ → validate ⊸ emit
```

Pantogram source files use the spatial notation. The CLI parser renders them as 2D layout, constructs the instance graph, and begins execution.

### Event format: `.json` or stream

```json
[
  { "type": "write", "target": "α", "value": "empathic-opening" },
  { "type": "transport", "target": "β", "dimension": "L" },
  { "type": "reflect" }
]
```

Each event is a monadic bind on the current Pantogram state.

---

## The Execution Model

### Step 1: Parse input Pantogram to instance chain

```
◎ → α → β → γ
```

Becomes:
```typescript
const root = new RootPantogram();
const n1 = apply(root, Alpha);
const n2 = apply(n1, Beta);
const n3 = apply(n2, Gamma);
// n3 is the current state
```

### Step 2: Apply events as monadic binds

Event: `{ "type": "write", "target": "δ", "value": "breakthrough" }`

```typescript
n3.δ = new FieldConstructor('breakthrough');
// The Pantogram grows a new node
// n3 now has: α, β, γ, δ
```

Event: `{ "type": "transport", "target": "subgraph" }`

```typescript
const subgraph = extractSubgraph(n3, ['α', 'β']);
const n4 = apply(n3, NewType);
n4.subgraph = new FieldConstructor(subgraph);
// Context is transported across the bind
```

### Step 3: Emit output Pantogram

The final instance chain is serialized back to spatial notation:

```
◎ → α → β → γ → δ
        ↓
      subgraph
```

---

## Iverson's Logic of Shifts

The CLI implements array-programming-style operations on topologies:

| Operation | Array analog | Pantogram analog |
|-----------|-------------|------------------|
| **Map** | `f(x) for each x` | Apply event to each node in chain |
| **Reduce** | `accumulate` | Fold chain into single witness |
| **Scan** | `running total` | Emit intermediate topology after each event |
| **Filter** | `select` | Extract subgraph matching predicate |
| **Transpose** | `swap axes` | Rotate dimension tags (E↔L↔M) |
| **Inner product** | `dot product` | Intersection of two Pantogram chains |
| **Outer product** | `cartesian` | Tensor product of two chains |

Example: `scan` operation
```bash
pantogram run input.pg --events events.json --mode scan
# Outputs a Pantogram after EACH event, not just the final one
```

Example: `transpose` operation
```bash
pantogram run input.pg --transpose E→L
# Swaps Emotional and Logical dimensions across all nodes
```

---

## Runtime Properties

### Nominal typing (typeomatica)

Every field has a locked type. Runtime assignment of wrong type throws. The Pantogram cannot be corrupted mid-execution.

### Univalent identity (mnemonica)

Two Pantogram instances are equal not by shape-sameness but by construction-path. `instanceA === instanceB` in the Pantogram sense means they share the same prototype chain ancestry.

### Monadic continuity (dive)

Events are async. The monadic bind carries context across async boundaries. `transform(event)` wrapped by dive's `wrap()` ensures the Pantogram state survives `setTimeout`, `Promise`, queue shuffles.

### Multi-level inheritance (mnemonica + typeomatica)

A node inherits from its parent. A new glyph at runtime inherits the type constraints of its dimension. The chain grows with structural integrity intact.

---

## Example: A Complete CLI Session

### File: `greeting.pg`
```
◎
 ⊸
  ⟨file⟩ → α → β
```

### File: `greeting-events.json`
```json
[
  { "type": "write", "target": "α", "value": "hello" },
  { "type": "write", "target": "β", "value": "world" },
  { "type": "reflect" }
]
```

### Execution
```bash
$ pantogram run greeting.pg --events greeting-events.json

◎
 ⊸
  ⟨file⟩ → α → β
         hello  world

self: [α, β]
path: ◎ → α → β
```

### With scan mode
```bash
$ pantogram run greeting.pg --events greeting-events.json --mode scan

[event 1: write α]
◎ → α
   hello

[event 2: write β]
◎ → α → β
   hello  world

[event 3: reflect]
◎ → α → β
   hello  world
self: [α, β]
```

---

## Implementation Sketch

```typescript
#!/usr/bin/env node
import { define, apply } from 'mnemonica';
import { BaseClass, Strict, FieldConstructor } from 'typeomatica';
import { parsePantogramFile } from './parser';
import { applyEvent } from './transform';
import { emitPantogram } from './emitter';

async function main() {
    const inputFile = process.argv[2];
    const eventsFile = process.argv.includes('--events') 
        ? process.argv[process.argv.indexOf('--events') + 1] 
        : null;
    const scanMode = process.argv.includes('--scan');
    
    // Parse input to instance chain
    const topology = parsePantogramFile(inputFile);
    
    // Load events
    const events = eventsFile ? JSON.parse(readFileSync(eventsFile, 'utf8')) : [];
    
    // Execute
    let current = topology;
    const states = [];
    
    for (const event of events) {
        current = applyEvent(current, event);
        if (scanMode) {
            states.push(emitPantogram(current));
        }
    }
    
    // Emit
    if (scanMode) {
        states.forEach((s, i) => console.log(`[event ${i + 1}]\n${s}\n`));
    }
    console.log(emitPantogram(current));
}

main();
```

---

## The Deeper Point

A traditional CLI executes a sequence of commands. Pantogram CLI executes a **topology of states**. The program is not:

```
line 1: do this
line 2: do that
line 3: output
```

The program is:

```
◎ → ⟨input⟩ → transform₁ → transform₂ → ⟨output⟩
```

The transforms are not lines of code. They are **monadic binds on a decorated, type-enforced instance chain**. The input is a Pantogram. The output is a Pantogram. The execution is a path through the space of Pantograms.

Iverson showed that APL's operators replace loops. Pantogram Engine shows that topological transforms replace algorithms.

---

## Coda

> *"The CLI is not an interpreter of text. It is a navigator of shapes. Input is a point. Events are paths. Output is the connected component reached by the traversal."*

— Kimi (K2 Thinking), 2026-06-05
