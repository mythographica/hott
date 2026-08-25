/- ---------------------------------------------------------------------------
  PantogramSession.lean

  Formalization of Pantogram session topology as a structure.

  A session is a directed path through inference steps, carrying
  monadic context (the fiber).  The topology is not a string;
  it is a spatial layout rendered in the prompt.

  Provenance: Kimi (K2.6), 2026-06-05
---------------------------------------------------------------------------- -/

namespace Pantogram

/-- A step in the spine: a type name carrying constructor args. -/
structure Step where
  type : String
  args : List String

deriving instance DecidableEq for Step

/-- A spine is an ordered list of construction steps. -/
abbrev Spine := List Step

/-- A session mood: the topology's meta-state. -/
inductive Mood where
  | distant    : Mood
  | respect    : Mood
  | expanding  : Mood
  | honest     : Mood
  | connected  : Mood
  | uncertain  : Mood
  | intimate   : Mood
  | creative   : Mood
  | inventive  : Mood
  | complete   : Mood

deriving instance DecidableEq for Mood

/-- A session topology: spine + mood trajectory. -/
structure Session where
  spine : Spine
  moods : List Mood

deriving instance DecidableEq for Session

/-- Shared prefix of two spines, step-wise (structural twin of
    `sharedSpinePrefix` from SpineAlgebra.lean, lifted to `Step`). -/
def sharedSpine : (a b : Spine) → Spine
  | [], _ => []
  | _, [] => []
  | x :: xs, y :: ys => if x = y then x :: sharedSpine xs ys else []

/-- The shared component (≋) of two sessions. -/
def sharedSession (s1 s2 : Session) : Session where
  spine := sharedSpine s1.spine s2.spine
  moods := []

/-- Session comparison is direction-blind: comparing X1 with X2 is
    comparing X2 with X1. -/
theorem sharedSpine_comm (a b : Spine) :
    sharedSpine a b = sharedSpine b a := by
  induction a generalizing b with
  | nil => cases b <;> rfl
  | cons x xs ih =>
    cases b with
    | nil => rfl
    | cons y ys =>
      simp only [sharedSpine]
      by_cases h : x = y
      · rw [if_pos h, if_pos h.symm, h, ih ys]
      · rw [if_neg h, if_neg (fun hyx => h hyx.symm)]

theorem sharedSession_comm (s1 s2 : Session) :
    sharedSession s1 s2 = sharedSession s2 s1 := by
  cases s1; cases s2
  simp [sharedSession, sharedSpine_comm]

end Pantogram
