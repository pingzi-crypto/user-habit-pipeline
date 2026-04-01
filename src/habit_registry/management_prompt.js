function parseListRequest(message) {
  if (/^\s*(列出|查看)(?:用户)?习惯短句\s*$/u.test(message)) {
    return { action: "list" };
  }

  return null;
}

function parseRemoveRequest(message) {
  const match = message.match(/^\s*(?:删除|移除|忘记)(?:用户)?习惯短句[:：]\s*(.+?)\s*$/u);
  if (!match) {
    return null;
  }

  return {
    action: "remove",
    phrase: stripWrappingQuotes(match[1])
  };
}

function stripWrappingQuotes(value) {
  return String(value || "")
    .trim()
    .replace(/^["'“”‘’](.*)["'“”‘’]$/u, "$1");
}

function parseKeyValueSegments(segmentText) {
  const segments = segmentText
    .split(/[;；]/u)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const result = {};

  for (const segment of segments) {
    const parts = segment.split(/[:=：]/u);
    if (parts.length < 2) {
      continue;
    }

    const rawKey = parts.shift();
    const rawValue = parts.join(":");
    result[String(rawKey).trim().toLowerCase()] = String(rawValue).trim();
  }

  return result;
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

function parseAddRequest(message) {
  const match = message.match(/^\s*(?:添加|新增|记住)(?:用户)?习惯短句[:：]\s*(.+?)\s*$/u);
  if (!match) {
    return null;
  }

  const fields = parseKeyValueSegments(match[1]);
  const phrase = stripWrappingQuotes(fields.phrase || fields["短句"]);
  const normalizedIntent = fields.intent || fields["意图"];

  if (!phrase || !normalizedIntent) {
    throw new Error(
      "Add-habit prompt requires at least phrase/短句 and intent/意图 fields."
    );
  }

  const scenarioBias = toStringArray(fields.scenario || fields["场景"]);
  const preferredTerms = toStringArray(
    fields.preferred_terms || fields.preferred || fields["术语"]
  );
  const notes = toStringArray(fields.notes || fields["备注"]);
  const disambiguationHints = toStringArray(
    fields.disambiguation_hints || fields["澄清提示"]
  );
  const confidence = fields.confidence || fields["置信度"];
  const clarifyBelow = fields.clarify_below || fields["澄清阈值"];
  const matchType = fields.match_type || fields["匹配方式"];

  const rule = {
    phrase,
    normalized_intent: normalizedIntent,
    scenario_bias: scenarioBias.length > 0 ? scenarioBias : ["general"],
    confidence: confidence ? Number(confidence) : 0.85
  };

  if (preferredTerms.length > 0) {
    rule.preferred_terms = preferredTerms;
  }

  if (notes.length > 0) {
    rule.notes = notes;
  }

  if (disambiguationHints.length > 0) {
    rule.disambiguation_hints = disambiguationHints;
  }

  if (matchType) {
    rule.match_type = matchType;
  }

  if (clarifyBelow) {
    rule.clarify_below = Number(clarifyBelow);
  }

  return {
    action: "add",
    rule
  };
}

function parseHabitManagementRequest(message) {
  const trimmedMessage = String(message || "").trim();
  if (!trimmedMessage) {
    return null;
  }

  return parseListRequest(trimmedMessage)
    || parseRemoveRequest(trimmedMessage)
    || parseAddRequest(trimmedMessage);
}

module.exports = {
  parseHabitManagementRequest
};
