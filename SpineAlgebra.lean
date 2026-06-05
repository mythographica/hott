/- ---------------------------------------------------------------------------
  SpineAlgebra.lean

  Formalization of the Pantogram spine algebra in Lean 4 (core only).

  Proofs (mechanically checked):
    1. continues_refl      -- reflexive
    2. continues_trans      -- transitive
    3. continues_antisymm   -- antisymmetric

  Hence `continues` is a partial order on spines.
---------------------------------------------------------------------------- -/

namespace Pantogram

def Spine := List String

deriving instance DecidableEq for Spine

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
-- Decidable
-- ---------------------------------------------------------------------------

instance decidable_continues (a b : Spine) : Decidable (continues a b) := by
  unfold continues
  infer_instance

end Pantogram
