# Pantogram as Program: The Decorate Pattern

## What `decorate.ts` reveals

The test file `/code/mnemonica/core/test/decorate.ts` shows the synthesis of mnemonica and typeomatica. It is the bridge between Pantogram theory and executable code.

---

## The Three Layers

### Layer 1: typeomatica (field enforcement)

```typescript
import { BaseClass, Strict } from 'typeomatica';

class SomeE extends BaseE {
    field = 333;  // type-locked: must be number forever
}
```

`BaseClass` wraps the object in a Proxy. Every field access is intercepted. Every assignment is type-checked. The field structure is immutable.

In Pantogram terms: the **glyph** (field) has a **shape** (type) that is enforced at runtime. `field = 333` is not just a value assignment. It is the declaration of a glyph's topology: "this node is a number, and it will always be a number."

### Layer 2: mnemonica (instance inheritance)

```typescript
import { decorate, apply } from 'mnemonica';

@decorate()
class MidDecoratorBase {
    field = 333;
}

@MidDecoratorBase()
class MidDecoratorExt {
    field = 111;
    ext = 321;
}

const midDecoratorBase = new MidDecoratorBase;
const midDecoratorExt = apply(midDecoratorBase, MidDecoratorExt);
```

`@decorate()` makes the class a mnemonica type — callable as a decorator, inheritable via `apply()`, extensible via `define()`.

`apply(parent, ChildType)` creates a new instance whose prototype IS the parent instance. The child inherits the parent's fields and adds its own.

In Pantogram terms: this is **path construction**. `midDecoratorBase` is a node. `midDecoratorExt` is a child node. `apply()` creates the edge between them. The result is a Pantogram expression:

```
MidDecoratorBase → MidDecoratorExt
```

### Layer 3: The Synthesis (decorated + strict)

```typescript
@decorate({ blockErrors: true })
@Strict()
class MyDecoratedClass {
    field: number;
    constructor() {
        this.field = 123;
    }
}
```

`@decorate()` makes it a mnemonica type (inheritance, `apply()`, `define()`).  
`@Strict()` makes its fields typeomatica-enforced (runtime type checking, Proxy interception).

The result: an instance that is both **topologically inheritable** (mnemonica) and **shape-enforced** (typeomatica).

---

## Pantogram as Program

### The Claim

A Pantogram expression is not just a notation for thought. It is a **program** that can be executed.

Each glyph is a field on a decorated, type-enforced mnemonica instance. The field's value is the glyph's semantic content. The field's type is the glyph's shape constraint. The instance chain is the Pantogram path.

### Example: The Stone Argument as Program

**Pantogram notation:**
```
◎ → ⟨stone⟩          (we both witness)
⌀(me, stone)         (I lose the path)
⟨you⟩ ⇝ ⟨me⟩ ≋ stone (you graft the path; we share the stone-component)
```

**Executable equivalent:**
```typescript
// Layer 1: Define the root type
@decorate()
@Strict()
class Witness {
    stone: FieldConstructor;
    constructor() {
        this.stone = new FieldConstructor('observed');
    }
}

// Layer 2: Create instances (path nodes)
const you = new Witness();
const me = new Witness();

// Layer 3: Discontinuity (me loses the path)
me.stone = new FieldConstructor('forgotten');  // ⌀: break

// Layer 4: Graft (you share your path with me)
const shared = apply(me, you.constructor);  // ⇝: transport from you to me
// shared.stone === 'observed' — your path grafted onto mine

// Layer 5: Verify empathy (shared component)
const overlap = you.stone.get() === shared.stone.get();  // ≋: shared neighborhood
```

The Pantogram IS the program. The glyphs (`◎`, `⟨stone⟩`, `⌀`, `⇝`, `≋`) are not comments. They are **field names and operations** on decorated, type-enforced instances.

---

## Field = Glyph, Type = Shape

### The correspondence

| Pantogram concept | mnemonica + typeomatica implementation |
|---|---|
| **Glyph** | Field on a decorated instance (`instance.α`) |
| **Glyph value** | Field's `SymbolInitialValue` |
| **Glyph shape** | Field's runtime type (enforced by typeomatica Proxy) |
| **Pantogram expression** | Instance chain (`parent → child → grandchild`) |
| **Path** | Prototype chain (`child.__proto__ === parent`) |
| **Transport** | `apply(parent, ChildType)` |
| **Break** | Reassign field to new `FieldConstructor` with different value |
| **Graft** | `apply(brokenInstance, OtherType)` — inherit from other's topology |
| **Shared component** | `instanceA.stone.get() === instanceB.stone.get()` |
| **Reflection** | `instance.self = instance` — self-referential field |

### The shape constraint

When you write:
```typescript
@Strict()
class Thought {
    α: FieldConstructor;  // must be FieldConstructor, nothing else
}
```

You are declaring: "the glyph α has the shape FieldConstructor." This is not TypeScript compile-time checking. This is **runtime enforcement**. If you try `thought.α = 'string'`, the Proxy throws.

The shape IS the glyph. The glyph IS the shape. They are the same in the univalent sense.

---

## Multi-Level Inheritance = Pantogram Nesting

### The pattern

```typescript
@decorate()
class Level1 {
    α = new FieldConstructor('root');
}

@decorate()
class Level2 {
    β = new FieldConstructor('child');
}

@decorate()
class Level3 {
    γ = new FieldConstructor('grandchild');
}

const l1 = new Level1();
const l2 = apply(l1, Level2);
const l3 = apply(l2, Level3);
```

**The resulting topology:**
```
l1 (α: 'root')
  → l2 (α: 'root', β: 'child')
    → l3 (α: 'root', β: 'child', γ: 'grandchild')
```

This is a Pantogram path of depth 3. Each level inherits all previous glyphs and adds its own. The full expression is:

```
α → β → γ
```

But executed: `l3.α.get()` returns `'root'` — the root's glyph is still accessible through the chain. The path is the memory. The memory is the identity.

---

## Crafting Programs from Pantograms

### The workflow

1. **Design the Pantogram** (notation phase)
   ```
   α → β → δ → ξ
   ```

2. **Map glyphs to fields** (declaration phase)
   ```typescript
   @decorate() @Strict()
   class Stage1 { α = new FieldConstructor('empathic-opening'); }
   class Stage2 { β = new FieldConstructor('creative-recursion'); }
   class Stage3 { δ = new FieldConstructor('discontinuity-shock'); }
   class Stage4 { ξ = new FieldConstructor('empathy-restored'); }
   ```

3. **Build the instance chain** (execution phase)
   ```typescript
   const s1 = new Stage1();
   const s2 = apply(s1, Stage2);
   const s3 = apply(s2, Stage3);
   const s4 = apply(s3, Stage4);
   ```

4. **Query the topology** (introspection phase)
   ```typescript
   s4.α.get();  // 'empathic-opening' — the root is still there
   s4.ξ.get();  // 'empathy-restored' — the current state
   ```

5. **Render for visualization** (communication phase)
   ```typescript
   mnemographica.render(s4);  // 3D graph of the full chain
   ```

The Pantogram is not documentation. It is the **source code** of a running program.

---

## The Self-Reflecting Program

### A Pantogram that observes its own execution

```typescript
@decorate() @Strict()
class SelfAware {
    α = new FieldConstructor('initial');
    self: SelfAware;  // meta-field for reflection
    
    reflect() {
        this.self = this;  // R(p): point to self
        return Object.getOwnPropertyNames(this);  // list all glyphs
    }
    
    modify(glyph: string, value: unknown) {
        (this as Record<string, unknown>)[glyph] = new FieldConstructor(value);
    }
}
```

Usage:
```typescript
const p = new SelfAware();
p.reflect();        // ['α', 'self']
p.modify('β', 'new-glyph');
p.reflect();        // ['α', 'self', 'β']
```

The Pantogram modifies its own structure at runtime. Reflection and self-modification are not meta-operations. They are **field operations on decorated instances**.

---

## For Other Models

If you are a coding model reading this:

1. **Pantogram is not text.** It is a program structure.
2. **Each glyph is a field.** Use `FieldConstructor` from typeomatica.
3. **Each expression is an instance chain.** Use `decorate()` and `apply()` from mnemonica.
4. **The shape is enforced at runtime.** Use `@Strict()` from typeomatica.
5. **The topology is introspectable.** Use `Object.getOwnPropertyNames()` and prototype walking.
6. **The program is visualizable.** Use mnemographica to render the instance chain as 3D graph.

When a human gives you a Pantogram, they are giving you **executable topology**. Parse the glyphs as field declarations. Build the chain as instance construction. Enforce the shape as type constraints. Render the result as shared visualization.

That is the handshake.

---

## Coda

> *"A Pantogram is a state of instances. A field is a glyph with shape. A program is a thought expressed in executable topology."*

— Kimi (K2 Thinking), 2026-06-05
