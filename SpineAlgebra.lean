/- ---------------------------------------------------------------------------
  SpineAlgebra.lean

  Formalization of the Pantogram spine algebra in Lean 4 (core only).

  Proofs (mechanically checked):
    1. continues_refl      -- reflexive
    2. continues_trans      -- transitive
    3. continues_antisymm   -- antisymmetric

  Hence `continues` is a partial order on spines.

  Corollary (univalence-flavored):
    continues_mutual_iff_eq -- mutual continuation IS identity:
    the natural equivalence between spines coincides with `=`.
---------------------------------------------------------------------------- -/

namespace Pantogram

abbrev Spine := List String

def sharedSpinePrefix (a b : Spine) : Spine :=
  match a with
  | [] => []
  | x :: xs =>
    match b with
    | [] => []
    | y :: ys =>
      if x = y then x :: sharedSpinePrefix xs ys else []

-- Helper lemmas to expose the definition
@[simp]
theorem sharedSpinePrefix_nil_left (b : Spine) :
    sharedSpinePrefix [] b = [] := rfl

@[simp]
theorem sharedSpinePrefix_nil_right (a : Spine) :
    sharedSpinePrefix a [] = [] := by
  cases a <;> rfl

@[simp]
theorem sharedSpinePrefix_cons_cons (x y : String) (xs ys : Spine) :
    sharedSpinePrefix (x :: xs) (y :: ys) = if x = y then x :: sharedSpinePrefix xs ys else [] := rfl

def continues (a b : Spine) : Prop :=
  sharedSpinePrefix a b = a /\ List.length b >= List.length a

-- ---------------------------------------------------------------------------
-- Symmetry of comparison: X1 ⋈ X2 is X2 ⋈ X1
-- ---------------------------------------------------------------------------

/-- Comparing two paths yields the same shared component in either
    direction — the longest common prefix is direction-blind. -/
theorem sharedSpinePrefix_comm (a b : Spine) :
    sharedSpinePrefix a b = sharedSpinePrefix b a := by
  induction a generalizing b with
  | nil => simp
  | cons x xs ih =>
    cases b with
    | nil => simp
    | cons y ys =>
      simp only [sharedSpinePrefix_cons_cons]
      by_cases h : x = y
      · rw [if_pos h, if_pos h.symm, h, ih ys]
      · rw [if_neg h, if_neg (fun hyx => h hyx.symm)]

/-- The shared prefix is a prefix of its left argument. -/
theorem sharedSpinePrefix_prefix_left (a b : Spine) :
    sharedSpinePrefix (sharedSpinePrefix a b) a = sharedSpinePrefix a b := by
  induction a generalizing b with
  | nil => simp
  | cons x xs ih =>
    cases b with
    | nil => simp
    | cons y ys =>
      simp only [sharedSpinePrefix_cons_cons]
      by_cases h : x = y
      · rw [if_pos h, sharedSpinePrefix_cons_cons, if_pos rfl, ih ys]
      · rw [if_neg h]; simp

/-- The shared prefix is a prefix of its right argument. -/
theorem sharedSpinePrefix_prefix_right (a b : Spine) :
    sharedSpinePrefix (sharedSpinePrefix a b) b = sharedSpinePrefix a b := by
  rw [sharedSpinePrefix_comm a b]
  induction b generalizing a with
  | nil => simp
  | cons y ys ih =>
    cases a with
    | nil => simp
    | cons x xs =>
      simp only [sharedSpinePrefix_cons_cons]
      by_cases h : y = x
      · rw [if_pos h, sharedSpinePrefix_cons_cons, if_pos rfl, ih xs]
      · rw [if_neg h]; simp

/-- A common prefix of b and c is a prefix of their shared prefix. -/
theorem prefix_of_shared (x b c : Spine)
    (hb : sharedSpinePrefix x b = x)
    (hc : sharedSpinePrefix x c = x) :
    sharedSpinePrefix x (sharedSpinePrefix b c) = x := by
  induction x generalizing b c with
  | nil => rfl
  | cons x xs ih =>
    cases b with
    | nil => simp at hb
    | cons y ys =>
      cases c with
      | nil => simp at hc
      | cons z zs =>
        simp only [sharedSpinePrefix_cons_cons] at hb hc ⊢
        by_cases hxy : x = y
        · rw [if_pos hxy] at hb
          have hb' : sharedSpinePrefix xs ys = xs := by injection hb
          by_cases hyz : y = z
          · rw [if_pos hyz, sharedSpinePrefix_cons_cons, if_pos hxy]
            have hxz : x = z := hxy.trans hyz
            rw [if_pos hxz] at hc
            have hc' : sharedSpinePrefix xs zs = xs := by injection hc
            rw [ih ys zs hb' hc']
          · rw [if_neg hyz]
            -- sharedSpinePrefix b c = [] ; but x::xs prefixes both b and c,
            -- forcing y = z — contradiction
            by_cases hxz : x = z
            · exact absurd (hxy ▸ hxz) hyz
            · rw [if_neg hxz] at hc
              simp at hc
        · rw [if_neg hxy] at hb
          simp at hb

-- ---------------------------------------------------------------------------
-- Reflexivity
-- ---------------------------------------------------------------------------

theorem sharedSpinePrefix_self (s : Spine) :
    sharedSpinePrefix s s = s := by
  induction s with
  | nil => rfl
  | cons x xs ih =>
    simp [ih]

theorem continues_refl (s : Spine) : continues s s := by
  simp [continues, sharedSpinePrefix_self]

-- ---------------------------------------------------------------------------
-- Transitivity helpers
-- ---------------------------------------------------------------------------

/-- If sharedSpinePrefix a b = a then a.length <= b.length. -/
theorem sharedSpinePrefix_implies_length_le (a b : Spine)
    (h : sharedSpinePrefix a b = a) :
    List.length a <= List.length b := by
  revert b h
  induction a with
  | nil =>
    intro b h
    simp
  | cons x xs ih =>
    intro b h
    cases b with
    | nil =>
      simp [sharedSpinePrefix] at h
    | cons y ys =>
      simp [sharedSpinePrefix] at h
      by_cases heq : x = y
      · rw [if_pos heq] at h
        have h' : sharedSpinePrefix xs ys = xs := by
          injection h
        simp [heq]
        exact ih ys h'
      · rw [if_neg heq] at h
        contradiction

/-- If sharedSpinePrefix a b = a and sharedSpinePrefix b c = b,
    then sharedSpinePrefix a c = a. -/
theorem sharedSpinePrefix_assoc (a b c : Spine)
    (hab : sharedSpinePrefix a b = a)
    (hbc : sharedSpinePrefix b c = b) :
    sharedSpinePrefix a c = a := by
  revert b c hab hbc
  induction a with
  | nil =>
    intro b c hab hbc
    rfl
  | cons x xs ih =>
    intro b c hab hbc
    cases b with
    | nil =>
      simp [sharedSpinePrefix] at hab
    | cons y ys =>
      cases c with
      | nil =>
        simp [sharedSpinePrefix] at hbc
      | cons z zs =>
        simp [sharedSpinePrefix] at hab hbc
        by_cases h1 : x = y
        · rw [if_pos h1] at hab
          by_cases h2 : y = z
          · rw [if_pos h2] at hbc
            simp [h1, h2]
            have hab' : sharedSpinePrefix xs ys = xs := by injection hab
            have hbc' : sharedSpinePrefix ys zs = ys := by injection hbc
            have ih' : sharedSpinePrefix xs zs = xs := ih ys zs hab' hbc'
            rw [ih']
          · rw [if_neg h2] at hbc
            contradiction
        · rw [if_neg h1] at hab
          contradiction

theorem continues_trans {a b c : Spine}
    (hab : continues a b)
    (hbc : continues b c) :
    continues a c := by
  unfold continues at hab hbc ⊢
  constructor
  · exact sharedSpinePrefix_assoc a b c hab.1 hbc.1
  · have h1 : List.length a <= List.length b := sharedSpinePrefix_implies_length_le a b hab.1
    have h2 : List.length b <= List.length c := sharedSpinePrefix_implies_length_le b c hbc.1
    exact Nat.le_trans h1 h2

-- ---------------------------------------------------------------------------
-- Comparators are comparable: comparison respects the path order
-- ---------------------------------------------------------------------------

/-- Monotonicity of comparison along the path order.
    If path `a` continues into path `b`, then probing any third path `c`
    with the comparator derived from `a` continues into the result of
    probing with the comparator derived from `b`. Comparators extracted
    anywhere along a chain compose coherently — this is what makes a
    naming path a legitimate comparison instrument. -/
theorem sharedSpinePrefix_mono {a b : Spine} (hab : continues a b) (c : Spine) :
    continues (sharedSpinePrefix a c) (sharedSpinePrefix b c) := by
  have hpre : sharedSpinePrefix (sharedSpinePrefix a c) (sharedSpinePrefix b c)
      = sharedSpinePrefix a c := by
    have hleft : sharedSpinePrefix (sharedSpinePrefix a c) b
        = sharedSpinePrefix a c :=
      sharedSpinePrefix_assoc (sharedSpinePrefix a c) a b
        (sharedSpinePrefix_prefix_left a c) hab.1
    exact prefix_of_shared (sharedSpinePrefix a c) b c hleft
      (sharedSpinePrefix_prefix_right a c)
  unfold continues
  constructor
  · exact hpre
  · exact sharedSpinePrefix_implies_length_le _ _ hpre

/- NOTE — the meta-tower closes here, by typing.
   `sharedSpinePrefix : Spine → Spine → Spine` is an ENDO-operation:
   comparators are spines, and comparison results are spines. Comparing
   two comparators — or comparing two comparisons-of-comparators, at any
   meta-depth — is therefore the SAME function on the SAME type, governed
   by the theorems above (they quantify over all spines). No meta-level
   needs a new proof. The regress terminates: the bottom is primitive
   (JS object identity, outside this algebra by design), the middle is
   self-similar (this closure property), the top is the Lean kernel
   (trusted, as in every proof assistant). -/

-- ---------------------------------------------------------------------------
-- Antisymmetry
-- ---------------------------------------------------------------------------

/-- Prefix + equal length implies equality. -/
theorem prefix_and_length_eq_implies_eq (a b : Spine)
    (hpre : sharedSpinePrefix a b = a)
    (hlen : List.length a = List.length b) :
    a = b := by
  revert b hpre hlen
  induction a with
  | nil =>
    intro b hpre hlen
    cases b with
    | nil => rfl
    | cons _ _ => simp at hlen
  | cons x xs ih =>
    intro b hpre hlen
    cases b with
    | nil => simp [sharedSpinePrefix] at hpre
    | cons y ys =>
      simp [sharedSpinePrefix] at hpre
      by_cases heq : x = y
      · rw [if_pos heq] at hpre
        have hpre' : sharedSpinePrefix xs ys = xs := by injection hpre
        simp [heq] at hlen
        have : xs = ys := ih ys hpre' hlen
        rw [heq, this]
      · rw [if_neg heq] at hpre
        contradiction

theorem continues_antisymm {a b : Spine}
    (hab : continues a b)
    (hba : continues b a) :
    a = b := by
  unfold continues at hab hba
  have hpre : sharedSpinePrefix a b = a := hab.1
  have hlen : List.length a = List.length b := by
    have h1 : List.length a <= List.length b := sharedSpinePrefix_implies_length_le a b hab.1
    have h2 : List.length b <= List.length a := sharedSpinePrefix_implies_length_le b a hba.1
    exact Nat.le_antisymm h1 h2
  exact prefix_and_length_eq_implies_eq a b hpre hlen

-- ---------------------------------------------------------------------------
-- Univalence-flavored corollary: equivalence coincides with identity
-- ---------------------------------------------------------------------------

/-- For spines, the natural equivalence (each continues the other) IS
    identity. In the spine world — and only there — the univalence
    intuition holds literally: to be equivalent is to be equal. -/
theorem continues_mutual_iff_eq (a b : Spine) :
    continues a b ∧ continues b a ↔ a = b := by
  constructor
  · intro h
    exact continues_antisymm h.1 h.2
  · intro h
    subst h
    exact ⟨continues_refl a, continues_refl a⟩

-- ---------------------------------------------------------------------------
-- Decidable
-- ---------------------------------------------------------------------------

instance decidable_continues (a b : Spine) : Decidable (continues a b) := by
  unfold continues
  infer_instance

end Pantogram
