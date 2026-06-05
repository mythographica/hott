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
def Spine := List Step

deriving instance DecidableEq for Spine

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

/-- The shared component (≋) of two sessions. -/
def sharedSession (s1 s2 : Session) : Session where
  spine := sharedSpinePrefix (s1.spine.map Step.type) (s2.spine.map Step.type)
           | .map (λ name => ⟨name, []⟩)
  moods := []

end Pantogram
