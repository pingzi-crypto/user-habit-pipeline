import { interpretHabit } from "./habit_core/interpreter";
import type {
  ExternalMemorySignal,
  HabitInput,
  HabitOutput,
  InterpretHabitOptions,
  MemoryConflictDecision,
  InterpretedPreActionResult,
  PreActionDecision
} from "./habit_core/types";

function getMatchedPhrase(result: HabitOutput): string | null {
  return result.habit_matches[0]?.phrase ?? null;
}

function normalizeExternalMemorySignal(
  externalMemorySignal: ExternalMemorySignal | null | undefined
): ExternalMemorySignal | null {
  if (!externalMemorySignal || typeof externalMemorySignal !== "object") {
    return null;
  }

  const normalizedIntent = String(externalMemorySignal.normalized_intent || "").trim();
  if (!normalizedIntent) {
    return null;
  }

  const sourceLabel = String(externalMemorySignal.source_label || "").trim() || "host_local_memory";
  const confidence = typeof externalMemorySignal.confidence === "number"
    && Number.isFinite(externalMemorySignal.confidence)
    ? externalMemorySignal.confidence
    : null;

  return {
    normalized_intent: normalizedIntent,
    source_label: sourceLabel,
    confidence
  };
}

export function buildPreActionDecision(result: HabitOutput): PreActionDecision {
  const matchedPhrase = getMatchedPhrase(result);

  if (!matchedPhrase || result.normalized_intent === "unknown") {
    return {
      decision_basis: "no_match",
      next_action: "ask_clarifying_question",
      normalized_intent: result.normalized_intent,
      confidence: result.confidence,
      matched_phrase: null,
      should_ask_clarifying_question: true,
      disambiguation_hints: result.disambiguation_hints,
      preferred_terms: result.preferred_terms,
      reason: "No explicit habit rule matched the current message.",
      host_guidance: "Do not execute downstream actions yet. Ask the user to restate the target or define the shorthand first."
    };
  }

  if (result.should_ask_clarifying_question) {
    return {
      decision_basis: "clarification_required",
      next_action: "ask_clarifying_question",
      normalized_intent: result.normalized_intent,
      confidence: result.confidence,
      matched_phrase: matchedPhrase,
      should_ask_clarifying_question: true,
      disambiguation_hints: result.disambiguation_hints,
      preferred_terms: result.preferred_terms,
      reason: result.disambiguation_hints[0]
        || "Matched shorthand is still under-specified or ambiguous.",
      host_guidance: "Ask one short clarifying question before selecting a downstream tool or workflow."
    };
  }

  return {
    decision_basis: "clear_match",
    next_action: "proceed",
    normalized_intent: result.normalized_intent,
    confidence: result.confidence,
    matched_phrase: matchedPhrase,
    should_ask_clarifying_question: false,
    disambiguation_hints: result.disambiguation_hints,
    preferred_terms: result.preferred_terms,
    reason: "Matched explicit shorthand with enough confidence to continue.",
    host_guidance: "Proceed into downstream workflow selection using normalized_intent as a semantic hint, not as hidden execution."
  };
}

export function buildMemoryConflictDecision(
  preActionDecision: PreActionDecision,
  externalMemorySignal?: ExternalMemorySignal | null
): MemoryConflictDecision {
  const normalizedSignal = normalizeExternalMemorySignal(externalMemorySignal);

  if (!normalizedSignal) {
    return {
      memory_conflict_detected: false,
      conflict_sources: [],
      final_next_action: preActionDecision.next_action,
      recommended_resolution: preActionDecision.next_action === "proceed"
        ? "use_pipeline_decision"
        : "ask_clarifying_question",
      pipeline_normalized_intent: preActionDecision.normalized_intent,
      external_memory_normalized_intent: null,
      external_memory_source_label: null,
      external_memory_confidence: null,
      reason: "No external local memory signal was provided.",
      host_guidance: preActionDecision.next_action === "proceed"
        ? "You may follow the pipeline decision directly."
        : "Keep the existing clarify-first behavior before any downstream action."
    };
  }

  if (!preActionDecision.matched_phrase || preActionDecision.normalized_intent === "unknown") {
    return {
      memory_conflict_detected: false,
      conflict_sources: ["pipeline_interpretation", normalizedSignal.source_label || "host_local_memory"],
      final_next_action: "ask_clarifying_question",
      recommended_resolution: "ask_clarifying_question",
      pipeline_normalized_intent: preActionDecision.normalized_intent,
      external_memory_normalized_intent: normalizedSignal.normalized_intent,
      external_memory_source_label: normalizedSignal.source_label || "host_local_memory",
      external_memory_confidence: normalizedSignal.confidence ?? null,
      reason: "External local memory cannot replace a missing or unknown explicit pipeline match.",
      host_guidance: "Ask one short clarifying question instead of treating hidden memory as authoritative."
    };
  }

  if (normalizedSignal.normalized_intent === preActionDecision.normalized_intent) {
    return {
      memory_conflict_detected: false,
      conflict_sources: ["pipeline_interpretation", normalizedSignal.source_label || "host_local_memory"],
      final_next_action: preActionDecision.next_action,
      recommended_resolution: preActionDecision.next_action === "proceed"
        ? "use_pipeline_decision"
        : "ask_clarifying_question",
      pipeline_normalized_intent: preActionDecision.normalized_intent,
      external_memory_normalized_intent: normalizedSignal.normalized_intent,
      external_memory_source_label: normalizedSignal.source_label || "host_local_memory",
      external_memory_confidence: normalizedSignal.confidence ?? null,
      reason: "External local memory agrees with the pipeline interpretation.",
      host_guidance: preActionDecision.next_action === "proceed"
        ? "Proceed using the pipeline interpretation as the explicit semantic source of truth."
        : "Even though both sides agree on intent, the shorthand still needs clarification before action."
    };
  }

  return {
    memory_conflict_detected: true,
    conflict_sources: ["pipeline_interpretation", normalizedSignal.source_label || "host_local_memory"],
    final_next_action: "ask_clarifying_question",
    recommended_resolution: "ask_clarifying_question",
    pipeline_normalized_intent: preActionDecision.normalized_intent,
    external_memory_normalized_intent: normalizedSignal.normalized_intent,
    external_memory_source_label: normalizedSignal.source_label || "host_local_memory",
    external_memory_confidence: normalizedSignal.confidence ?? null,
    reason: "External local memory disagrees with the pipeline interpretation.",
    host_guidance: "Do not silently override the pipeline meaning. Ask the user which meaning applies now."
  };
}

export function interpretHabitForPreAction(
  input: HabitInput,
  options: InterpretHabitOptions = {}
): InterpretedPreActionResult {
  const result = interpretHabit(input, options);

  return {
    result,
    pre_action_decision: buildPreActionDecision(result)
  };
}
