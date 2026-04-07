const { normalizeText } = require("../habit_core/context_rules");
const { loadDefaultHabits } = require("../habit_core/interpreter");
const { parseHabitManagementRequest } = require("../habit_registry/management_prompt");
const {
  USER_REGISTRY_PATH,
  loadMergedHabits,
  loadUserRegistryState
} = require("../habit_registry/user_registry");
const { validateHabitRules } = require("../habit_registry/validate_registry");

const ROLE_PATTERN = /^\s*(user|assistant|system|tool|用户|助手|系统|工具)\s*[:：]\s*(.*)$/iu;
const MAX_PHRASE_LENGTH = 24;
const MIN_REPEATED_PHRASE_COUNT = 2;
const DEFAULT_MAX_CANDIDATES = 5;

function clampScore(value) {
  return Math.max(0, Math.min(1, Number(Number(value).toFixed(2))));
}

function buildConfidenceDetails({
  sourceType,
  baseScore,
  adjustments = [],
  finalScore,
  summary
}) {
  return {
    domain: "session_suggestion",
    source_type: sourceType,
    base_score: clampScore(baseScore),
    adjustments: adjustments.map((item) => ({
      type: item.type,
      delta: clampScore(item.delta),
      applied: item.applied !== false,
      note: item.note
    })),
    final_score: clampScore(finalScore),
    summary: String(summary || "").trim()
  };
}

function normalizePhrase(value) {
  return normalizeText(String(value || ""));
}

function canonicalizeRole(label) {
  const normalized = normalizeText(label);
  if (normalized === "user" || normalized === "用户") {
    return "user";
  }

  if (normalized === "assistant" || normalized === "助手") {
    return "assistant";
  }

  if (normalized === "system" || normalized === "系统") {
    return "system";
  }

  if (normalized === "tool" || normalized === "工具") {
    return "tool";
  }

  return "unknown";
}

function parseSessionTranscript(transcriptText) {
  const text = String(transcriptText || "").replace(/\r\n/g, "\n").trim();
  if (!text) {
    return [];
  }

  const lines = text.split("\n");
  const messages = [];
  let current = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/u, "");
    const roleMatch = line.match(ROLE_PATTERN);

    if (roleMatch) {
      if (current) {
        current.content = current.content.join("\n").trim();
        if (current.content) {
          messages.push(current);
        }
      }

      current = {
        role: canonicalizeRole(roleMatch[1]),
        content: [roleMatch[2] || ""]
      };
      continue;
    }

    if (!current) {
      current = {
        role: "unknown",
        content: [line]
      };
      continue;
    }

    current.content.push(line);
  }

  if (current) {
    current.content = current.content.join("\n").trim();
    if (current.content) {
      messages.push(current);
    }
  }

  return messages;
}

function stripWrappingQuotes(value) {
  return String(value || "")
    .trim()
    .replace(/^["'“”‘’](.*)["'“”‘’]$/u, "$1");
}

function toStringArray(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(/[,，]/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseInlineScenarioBias(message) {
  const match = String(message || "").match(/(?:场景|scenario)\s*[:=：]\s*([a-z0-9_,，-]+)/iu);
  return match ? toStringArray(match[1]) : [];
}

function buildKnownPhraseSet(registryPath) {
  const mergedRules = loadMergedHabits(loadDefaultHabits(), registryPath);
  const state = loadUserRegistryState(registryPath);
  const phrases = new Set();

  for (const rule of mergedRules) {
    phrases.add(normalizePhrase(rule.phrase));
  }

  for (const rule of state.additions) {
    phrases.add(normalizePhrase(rule.phrase));
  }

  for (const phrase of state.removals) {
    phrases.add(normalizePhrase(phrase));
  }

  for (const phrase of state.ignored_suggestions) {
    phrases.add(normalizePhrase(phrase));
  }

  return phrases;
}

function isShortCandidatePhrase(value) {
  const text = stripWrappingQuotes(value);
  if (!text || text.length < 2 || text.length > MAX_PHRASE_LENGTH) {
    return false;
  }

  if (/[\n\r]/u.test(text)) {
    return false;
  }

  if (/https?:\/\//iu.test(text)) {
    return false;
  }

  if (/[。！？!?]/u.test(text)) {
    return false;
  }

  return true;
}

function countPhraseOccurrences(messages, phrase) {
  const normalizedPhrase = normalizePhrase(phrase);
  let count = 0;

  for (const message of messages) {
    if (message.role !== "user" && message.role !== "unknown") {
      continue;
    }

    if (normalizePhrase(message.content).includes(normalizedPhrase)) {
      count += 1;
    }
  }

  return count;
}

function collectExamples(messages, phrase, maxExamples = 3) {
  const normalizedPhrase = normalizePhrase(phrase);
  const examples = [];

  for (const message of messages) {
    if (message.role !== "user" && message.role !== "unknown") {
      continue;
    }

    if (normalizePhrase(message.content).includes(normalizedPhrase)) {
      examples.push(message.content);
    }

    if (examples.length >= maxExamples) {
      break;
    }
  }

  return examples;
}

function buildCandidateRecord(phrase, candidate) {
  return {
    phrase,
    source_type: candidate.source_type,
    action: candidate.action,
    confidence: clampScore(candidate.confidence),
    confidence_details: candidate.confidence_details,
    suggested_rule: candidate.suggested_rule || null,
    evidence: candidate.evidence,
    risk_flags: candidate.risk_flags
  };
}

function addOrReplaceCandidate(candidates, phrase, candidate) {
  const normalizedPhrase = normalizePhrase(phrase);
  const existing = candidates.get(normalizedPhrase);
  const priority = {
    explicit_add_request: 3,
    explicit_definition: 2,
    repeated_phrase: 1
  };

  if (!existing || (priority[candidate.source_type] || 0) > (priority[existing.source_type] || 0)) {
    candidates.set(normalizedPhrase, buildCandidateRecord(phrase, candidate));
  }
}

function extractExplicitDefinitionRule(message) {
  const patterns = [
    {
      pattern:
        /(?:以后|下次|之后)?(?:如果|当)?我说\s*["“]?(.+?)["”]?\s*(?:的时候)?(?:，|,|\s)*(?:就是|指的是|表示|默认表示|意思是)\s*([a-z][a-z0-9_]*)\b/iu,
      correctionCount: 0
    },
    {
      pattern: /(?:这里的|把)\s*["“]?(.+?)["”]?\s*(?:定义为|记成|当作|表示|指的是)\s*([a-z][a-z0-9_]*)\b/iu,
      correctionCount: 0
    },
    {
      pattern: /^["“]?(.+?)["”]?\s*(?:默认)?(?:表示|指的是|意思是)\s*([a-z][a-z0-9_]*)\b/iu,
      correctionCount: 0
    },
    {
      pattern:
        /(?:我这里的|这里的)?\s*["“]?(.+?)["”]?\s*不是\s*[^,\n，。！？!?]+(?:，|,)?\s*(?:是|而是|意思是|表示|指的是)\s*([a-z][a-z0-9_]*)\b/iu,
      correctionCount: 1
    },
    {
      pattern:
        /["“]?(.+?)["”]?\s*不是\s*[^,\n，。！？!?]+(?:，|,)?\s*(?:意思是|表示|指的是|应当是|应该是)\s*([a-z][a-z0-9_]*)\b/iu,
      correctionCount: 1
    }
  ];

  for (const entry of patterns) {
    const match = String(message || "").match(entry.pattern);
    if (!match) {
      continue;
    }

    const phrase = stripWrappingQuotes(match[1]);
    const normalizedIntent = String(match[2] || "").trim();
    if (!isShortCandidatePhrase(phrase) || !normalizedIntent) {
      continue;
    }

    const scenarioBias = parseInlineScenarioBias(message);
    const confidence =
      0.84 +
      (scenarioBias.length > 0 ? 0.04 : 0) +
      (entry.correctionCount > 0 ? 0.03 : 0);
    const rule = {
      phrase,
      normalized_intent: normalizedIntent,
      scenario_bias: scenarioBias.length > 0 ? scenarioBias : ["general"],
      confidence
    };

    validateHabitRules([rule]);
    return {
      rule,
      correction_count: entry.correctionCount
    };
  }

  return null;
}

function extractExplicitCandidates(messages, knownPhrases) {
  const candidates = new Map();

  for (const message of messages) {
    if (message.role !== "user" && message.role !== "unknown") {
      continue;
    }

    let parsedRequest = null;
    try {
      parsedRequest = parseHabitManagementRequest(message.content);
    } catch {
      parsedRequest = null;
    }

    if (parsedRequest && parsedRequest.action === "add") {
      const phrase = parsedRequest.rule.phrase;
      if (!knownPhrases.has(normalizePhrase(phrase))) {
        const uncappedConfidence = parsedRequest.rule.confidence + 0.08;
        const finalConfidence = Math.min(uncappedConfidence, 0.98);
        addOrReplaceCandidate(candidates, phrase, {
          source_type: "explicit_add_request",
          action: "suggest_add",
          confidence: finalConfidence,
          confidence_details: buildConfidenceDetails({
            sourceType: "explicit_add_request",
            baseScore: parsedRequest.rule.confidence,
            adjustments: [
              {
                type: "structured_request_bonus",
                delta: 0.08,
                note: "会话中已经出现兼容习惯管理格式的新增请求。"
              },
              {
                type: "suggestion_cap",
                delta: uncappedConfidence > 0.98 ? uncappedConfidence - finalConfidence : 0,
                applied: uncappedConfidence > 0.98,
                note: "即使是很强的新增请求，建议分也会封顶在 0.98。"
              }
            ],
            finalScore: finalConfidence,
            summary: "会话里出现了结构化新增请求，这条候选已经接近可直接确认。"
          }),
          suggested_rule: parsedRequest.rule,
          evidence: {
            occurrence_count: countPhraseOccurrences(messages, phrase),
            correction_count: 0,
            examples: collectExamples(messages, phrase)
          },
          risk_flags: []
        });
      }
      continue;
    }

    const explicitDefinition = extractExplicitDefinitionRule(message.content);
    if (!explicitDefinition) {
      continue;
    }

    const explicitRule = explicitDefinition.rule;

    if (knownPhrases.has(normalizePhrase(explicitRule.phrase))) {
      continue;
    }

    addOrReplaceCandidate(candidates, explicitRule.phrase, {
      source_type: "explicit_definition",
      action: "suggest_add",
      confidence: explicitRule.confidence,
      confidence_details: buildConfidenceDetails({
        sourceType: "explicit_definition",
        baseScore: 0.84,
        adjustments: [
          {
            type: "explicit_correction_bonus",
            delta: 0.03,
            applied: explicitDefinition.correction_count > 0,
            note: "用户不仅定义了短句，还显式纠正了之前可能的误读。"
          },
          {
            type: "scenario_specificity_bonus",
            delta: explicitRule.scenario_bias.includes("general") ? 0 : 0.04,
            applied: !explicitRule.scenario_bias.includes("general"),
            note: "带有明确场景信息的定义，比仅有通用场景的映射更具体。"
          }
        ],
        finalScore: explicitRule.confidence,
        summary:
          explicitDefinition.correction_count > 0
            ? explicitRule.scenario_bias.includes("general")
              ? "会话里出现了带纠正式澄清的短句定义，但场景仍然偏通用。"
              : "会话里出现了带纠正式澄清和明确场景的短句定义，证据很强。"
            : explicitRule.scenario_bias.includes("general")
              ? "会话里出现了明确的短句定义，但场景仍然偏通用。"
              : "会话里出现了带明确场景的短句定义，证据较强。"
      }),
      suggested_rule: explicitRule,
      evidence: {
        occurrence_count: countPhraseOccurrences(messages, explicitRule.phrase),
        correction_count: explicitDefinition.correction_count,
        examples: collectExamples(messages, explicitRule.phrase)
      },
      risk_flags: explicitRule.scenario_bias.includes("general")
        ? ["scenario_unspecified"]
        : []
    });
  }

  return candidates;
}

function extractRepeatedPhraseCandidates(messages, knownPhrases, explicitCandidates) {
  const phraseCounts = new Map();

  for (const message of messages) {
    if (message.role !== "user" && message.role !== "unknown") {
      continue;
    }

    const content = String(message.content || "").trim();
    if (!isShortCandidatePhrase(content)) {
      continue;
    }

    let parsedRequest = null;
    try {
      parsedRequest = parseHabitManagementRequest(content);
    } catch {
      parsedRequest = null;
    }

    if (parsedRequest) {
      continue;
    }

    const normalized = normalizePhrase(content);
    const current = phraseCounts.get(normalized) || {
      phrase: content,
      count: 0
    };

    current.count += 1;
    phraseCounts.set(normalized, current);
  }

  const repeatedCandidates = new Map();

  for (const [normalizedPhrase, entry] of phraseCounts.entries()) {
    if (entry.count < MIN_REPEATED_PHRASE_COUNT) {
      continue;
    }

    if (knownPhrases.has(normalizedPhrase) || explicitCandidates.has(normalizedPhrase)) {
      continue;
    }

    addOrReplaceCandidate(repeatedCandidates, entry.phrase, {
      source_type: "repeated_phrase",
      action: "review_only",
      confidence: 0.55 + Math.min((entry.count - MIN_REPEATED_PHRASE_COUNT) * 0.05, 0.15),
      confidence_details: buildConfidenceDetails({
        sourceType: "repeated_phrase",
        baseScore: 0.55,
        adjustments: [
          {
            type: "repetition_bonus",
            delta: Math.min((entry.count - MIN_REPEATED_PHRASE_COUNT) * 0.05, 0.15),
            note: `当前会话中观察到 ${entry.count} 次用户侧重复出现。`
          },
          {
            type: "single_thread_limit",
            delta: 0,
            applied: false,
            note: "这类重复证据只来自当前会话，而且可能仍缺少明确 intent，因此保持为复核候选。"
          }
        ],
        finalScore: 0.55 + Math.min((entry.count - MIN_REPEATED_PHRASE_COUNT) * 0.05, 0.15),
        summary: "当前会话里短句重复出现，值得复核，但还不适合直接启用。"
      }),
      suggested_rule: null,
      evidence: {
        occurrence_count: entry.count,
        correction_count: 0,
        examples: collectExamples(messages, entry.phrase)
      },
      risk_flags: ["single_thread_only", "missing_intent"]
    });
  }

  return repeatedCandidates;
}

function compareCandidates(left, right) {
  const actionPriority = { suggest_add: 2, review_only: 1 };
  const leftAction = actionPriority[left.action] || 0;
  const rightAction = actionPriority[right.action] || 0;

  if (leftAction !== rightAction) {
    return rightAction - leftAction;
  }

  if (left.confidence !== right.confidence) {
    return right.confidence - left.confidence;
  }

  if (left.evidence.occurrence_count !== right.evidence.occurrence_count) {
    return right.evidence.occurrence_count - left.evidence.occurrence_count;
  }

  return left.phrase.localeCompare(right.phrase, "zh-Hans-CN");
}

function suggestSessionHabitCandidates(transcriptText, options = {}) {
  const registryPath = options.userRegistryPath || USER_REGISTRY_PATH;
  const maxCandidates = Number.isInteger(options.maxCandidates)
    ? options.maxCandidates
    : DEFAULT_MAX_CANDIDATES;
  const messages = parseSessionTranscript(transcriptText);
  const knownPhrases = buildKnownPhraseSet(registryPath);
  const explicitCandidates = extractExplicitCandidates(messages, knownPhrases);
  const repeatedCandidates = extractRepeatedPhraseCandidates(messages, knownPhrases, explicitCandidates);
  const allCandidates = [
    ...explicitCandidates.values(),
    ...repeatedCandidates.values()
  ]
    .sort(compareCandidates)
    .slice(0, Math.max(1, maxCandidates))
    .map((candidate, index) => ({
      candidate_id: `c${index + 1}`,
      ...candidate
    }));

  return {
    schema_version: "1.0",
    record_type: "session_habit_suggestions",
    transcript_stats: {
      message_count: messages.length,
      user_message_count: messages.filter((item) => item.role === "user" || item.role === "unknown").length
    },
    candidates: allCandidates
  };
}

function parseCandidateReference(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    throw new Error("Candidate reference is required.");
  }

  const numberedMatch = raw.match(/^(?:c)?(\d+)$/iu) || raw.match(/^第\s*(\d+)\s*条$/u);
  if (numberedMatch) {
    return `c${Number(numberedMatch[1])}`;
  }

  return raw;
}

function validateSuggestionSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error("Suggestion snapshot must be a JSON object.");
  }

  if (!Array.isArray(snapshot.candidates)) {
    throw new Error('Suggestion snapshot must include a "candidates" array.');
  }

  return snapshot;
}

function findSuggestedCandidate(snapshot, reference) {
  const validated = validateSuggestionSnapshot(snapshot);
  const candidateId = parseCandidateReference(reference);
  const candidate = validated.candidates.find((item) => item && item.candidate_id === candidateId);

  if (!candidate) {
    throw new Error(`Unable to find suggestion candidate "${reference}".`);
  }

  return candidate;
}

module.exports = {
  DEFAULT_MAX_CANDIDATES,
  findSuggestedCandidate,
  parseCandidateReference,
  parseSessionTranscript,
  suggestSessionHabitCandidates,
  validateSuggestionSnapshot
};
