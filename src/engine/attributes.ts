// src/engine/attributes.ts
// Re-export types from the canonical source (`types.ts`).
// Because `verbatimModuleSyntax` is enabled, use `export type`.

export type {
  Resource,
  BaseAttributes as Attributes,  // alias for old imports that used "Attributes"
  GearBonuses,
  Tags,
  Actor,
  CombatState,
  LogEvent,
} from './types';
