function parseListRequest(message) {
  if (/^\s*(?:列出|查看|看看|看下|看一下)(?:当前)?(?:用户)?习惯短句(?:列表)?\s*$/u.test(message)) {
    return { action: "list" };
  }

  return null;
}

function parseSuggestRequest(message) {
  if (
    /^\s*(?:扫描|整理|看看|查看)(?:这次|当前)?(?:会话|对话|线程)(?:里|中)?(?:的)?(?:习惯候选|常用短句|纠正说法|用户习惯候选)\s*$/u.test(message)
    || /^\s*(?:根据|按)(?:这次|当前)?(?:会话|对话|线程)(?:内容)?建议我新增哪些(?:用户)?习惯短句\s*$/u.test(message)
  ) {
    return {
      action: "suggest",
      scope: "current_session"
    };
  }

  return null;
}

function parseApplyCandidateOverrides(segmentText) {
  const overrides = {};
  const fields = parseKeyValueSegments(segmentText);
  const intent = stripWrappingQuotes(fields.intent || fields["意图"]);
  const scenarioValue = stripWrappingQuotes(fields.scenario || fields["场景"]);
  const confidenceValue = stripWrappingQuotes(fields.confidence || fields["置信度"]);

  if (intent) {
    overrides.intent = intent;
  }

  if (scenarioValue) {
    overrides.scenario_bias = toStringArray(scenarioValue);
  }

  if (confidenceValue) {
    overrides.confidence = Number(confidenceValue);
  }

  const shorthandScenario = String(segmentText || "").match(/([a-z0-9_,-]+)\s*场景/iu);
  if (!overrides.scenario_bias && shorthandScenario) {
    overrides.scenario_bias = toStringArray(shorthandScenario[1]);
  }

  const shorthandIntent = String(segmentText || "").match(/([a-z][a-z0-9_]*)\s*意图/iu);
  if (!overrides.intent && shorthandIntent) {
    overrides.intent = shorthandIntent[1];
  }

  return overrides;
}

function parseApplyCandidateRequest(message) {
  const patterns = [
    /^\s*(?:添加|加入|保存|采用)\s*(?:第\s*(\d+)\s*条|c(\d+))(?:候选|习惯候选)?(?:到(?:用户)?习惯短句|到overlay|到用户overlay)?\s*(.*)$/u,
    /^\s*把\s*(?:第\s*(\d+)\s*条|c(\d+))(?:候选|习惯候选)?(?:加到|加入)(?:用户)?习惯短句?\s*(.*)$/u,
    /^\s*把\s*(?:第\s*(\d+)\s*条|c(\d+))(?:候选|习惯候选)?\s*(.*)$/u
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (!match) {
      continue;
    }

    const index = match[1] || match[2];
    const overrides = parseApplyCandidateOverrides(match[3] || "");
    return {
      action: "apply-candidate",
      candidate_ref: `c${Number(index)}`,
      ...overrides
    };
  }

  return null;
}

function parseRemoveRequest(message) {
  const match = message.match(/^\s*(?:删除|移除|忘记)(?:掉|掉这个)?(?:用户)?习惯短句(?:[:：]|\s)\s*(.+?)\s*$/u);
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
    .split(/[;；\n]/u)
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

function parsePathRequest(message, config) {
  const match = message.match(config.pattern);
  if (!match) {
    return null;
  }

  const fields = parseKeyValueSegments(match[1]);
  const pathValue = stripWrappingQuotes(fields.path || fields.file || fields["路径"] || fields["文件"]);
  const modeValue = stripWrappingQuotes(fields.mode || fields["模式"]);

  if (!pathValue) {
    throw new Error(`${config.label} prompt requires path/file/路径/文件.`);
  }

  return {
    action: config.action,
    path: pathValue,
    mode: modeValue || undefined
  };
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
  const match = message.match(/^\s*(?:添加|新增|记住)(?:一个|这条)?(?:用户)?习惯短句(?:[:：]|\s)\s*([\s\S]+?)\s*$/u);
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

function parseImportRequest(message) {
  return parsePathRequest(message, {
    action: "import",
    label: "Import-habit",
    pattern: /^\s*(?:导入|导进去|载入)(?:用户)?习惯短句(?:[:：]|\s)\s*(.+?)\s*$/u
  });
}

function parseExportRequest(message) {
  return parsePathRequest(message, {
    action: "export",
    label: "Export-habit",
    pattern: /^\s*(?:导出|导出来|备份)(?:用户)?习惯短句(?:[:：]|\s)\s*(.+?)\s*$/u
  });
}

function parseHabitManagementRequest(message) {
  const trimmedMessage = String(message || "").trim();
  if (!trimmedMessage) {
    return null;
  }

  return parseListRequest(trimmedMessage)
    || parseSuggestRequest(trimmedMessage)
    || parseApplyCandidateRequest(trimmedMessage)
    || parseRemoveRequest(trimmedMessage)
    || parseImportRequest(trimmedMessage)
    || parseExportRequest(trimmedMessage)
    || parseAddRequest(trimmedMessage);
}

module.exports = {
  parseHabitManagementRequest
};
