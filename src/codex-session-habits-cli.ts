#!/usr/bin/env node

import fs = require("node:fs");
import path = require("node:path");
import { spawnSync } from "node:child_process";
import type { HabitRule } from "./habit_core/types";
import { parseHabitManagementRequest } from "./habit_registry/management_prompt";
import { USER_REGISTRY_PATH } from "./habit_registry/user_registry";

const {
  DEFAULT_MAX_CANDIDATES
} = require("./session_suggestions/extract_candidates") as {
  DEFAULT_MAX_CANDIDATES: number;
};

const MANAGE_HABITS_CLI_PATH = path.join(__dirname, "manage-habits-cli.js");
const LOCAL_STOP_PATTERN = /^\s*(停|跳过)\s*$/u;

type AssessmentLevel = "unknown" | "low_roi" | "actionable" | "stopped";

interface SessionHabitCliArgs {
  help: boolean;
  maxCandidates: number;
  registryPath: string;
  request: string | null;
  threadFromStdin: boolean;
  threadPath: string | null;
}

interface ConfidenceAdjustment {
  type: string;
  delta?: number;
  applied?: boolean;
  note?: string;
}

interface ConfidenceDetails {
  summary?: string;
  adjustments?: ConfidenceAdjustment[];
  [key: string]: unknown;
}

interface SessionHabitCandidate {
  candidate_id: string;
  phrase: string;
  action?: string;
  confidence?: number;
  confidence_details?: ConfidenceDetails;
  suggested_rule?: HabitRule | null;
  risk_flags?: string[];
  [key: string]: unknown;
}

interface NextStepAssessment {
  level: AssessmentLevel;
  reason: string;
  stop_word: string | null;
}

interface RenderedAssistantReply {
  assistant_reply_markdown: string;
  suggested_follow_ups: string[];
  next_step_assessment: NextStepAssessment;
}

interface SessionHabitOutput {
  action?: string;
  request?: string;
  candidate_count?: number;
  candidates?: SessionHabitCandidate[];
  additions?: HabitRule[];
  removals?: string[];
  ignored_suggestions?: string[];
  ignored_phrase?: string;
  removed_phrase?: string;
  added_rule?: HabitRule;
  applied_rule?: HabitRule;
  transcript_stats?: Record<string, unknown>;
  [key: string]: unknown;
}

export function parseArgs(argv: string[]): SessionHabitCliArgs {
  const parsed: SessionHabitCliArgs = {
    help: false,
    maxCandidates: DEFAULT_MAX_CANDIDATES,
    registryPath: USER_REGISTRY_PATH,
    request: null,
    threadFromStdin: false,
    threadPath: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--request") {
      parsed.request = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--thread") {
      parsed.threadPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--thread-stdin") {
      parsed.threadFromStdin = true;
      continue;
    }

    if (token === "--user-registry") {
      parsed.registryPath = argv[index + 1] ?? USER_REGISTRY_PATH;
      index += 1;
      continue;
    }

    if (token === "--max-candidates") {
      parsed.maxCandidates = Number(argv[index + 1] ?? DEFAULT_MAX_CANDIDATES);
      index += 1;
      continue;
    }

    if (token === "--help" || token === "-h") {
      parsed.help = true;
    }
  }

  return parsed;
}

export function getUsageText(): string {
  return [
    "Usage: codex-session-habits --request <text> [--thread <path> | --thread-stdin] [--max-candidates <n>] [--user-registry <path>]",
    "",
    "Examples:",
    "  codex-session-habits --request \"扫描这次会话里的习惯候选\" --thread .\\data\\thread.txt",
    "  codex-session-habits --request \"添加第1条\"",
    "  codex-session-habits --request \"把第1条加到 session_close 场景\"",
    "  @'\nuser: 以后我说“收尾一下”就是 close_session\nassistant: 收到。\nuser: 收尾一下\n'@ | codex-session-habits --request \"扫描这次会话里的习惯候选\" --thread-stdin",
    "",
    "Behavior:",
    "  - forwards lightweight management prompts into manage-habits-cli.js",
    "  - uses --thread / --thread-stdin only for current-session suggestion scans",
    "  - relies on the latest local suggestion cache for short follow-up apply requests",
    "",
    "Options:",
    "  --request <text>         Prompt-style habit management request.",
    "  --thread <path>          Session transcript file for current-session suggestion scans.",
    "  --thread-stdin          Read the session transcript from stdin for current-session scans.",
    `  --max-candidates <n>    Maximum suggestion candidates to return. Default: ${DEFAULT_MAX_CANDIDATES}.`,
    `  --user-registry <path>  Optional user registry path. Default: ${path.relative(process.cwd(), USER_REGISTRY_PATH) || USER_REGISTRY_PATH}`,
    "  --help, -h               Show this help text."
  ].join("\n");
}

function printUsageAndExit(exitCode: number = 1, stream: NodeJS.WriteStream = process.stderr): never {
  stream.write(`${getUsageText()}\n`);
  process.exit(exitCode);
}

export function validateArgs(args: SessionHabitCliArgs): void {
  if (!args.request) {
    throw new Error("--request is required.");
  }

  if (args.threadFromStdin && args.threadPath) {
    throw new Error("Use only one thread source: --thread <path> or --thread-stdin.");
  }

  if (LOCAL_STOP_PATTERN.test(args.request)) {
    return;
  }

  const parsedRequest = parseHabitManagementRequest(args.request);
  if (!parsedRequest) {
    throw new Error("Unable to parse habit management request.");
  }

  if (parsedRequest.action === "suggest" && !args.threadFromStdin && !args.threadPath) {
    throw new Error("Current-session suggestion scans require --thread <path> or --thread-stdin.");
  }
}

export function parseJsonOutput(text: string): SessionHabitOutput {
  const normalized = String(text || "").trim();
  if (!normalized) {
    throw new Error("Backend returned empty stdout.");
  }

  return JSON.parse(normalized) as SessionHabitOutput;
}

function formatAdjustmentZh(adjustment: ConfidenceAdjustment): string {
  const delta = typeof adjustment.delta === "number" ? adjustment.delta.toFixed(2) : "0.00";

  if (adjustment.type === "structured_request_bonus") {
    return `包含结构化新增请求，加 ${delta}`;
  }

  if (adjustment.type === "explicit_correction_bonus") {
    return adjustment.applied
      ? `包含显式纠正式定义，加 ${delta}`
      : "没有显式纠正式定义加分";
  }

  if (adjustment.type === "suggestion_cap" && adjustment.applied) {
    return "命中建议分数上限 0.98";
  }

  if (adjustment.type === "scenario_specificity_bonus") {
    return adjustment.applied
      ? `包含明确场景信息，加 ${delta}`
      : "未提供明确场景，保持通用候选";
  }

  if (adjustment.type === "repetition_bonus") {
    return `当前会话重复带来加分 ${delta}`;
  }

  if (adjustment.type === "single_thread_limit") {
    return "仅来自当前会话，暂不直接提升为可自动添加";
  }

  return adjustment.note || adjustment.type;
}

function formatRiskFlagsZh(riskFlags: unknown): string[] {
  const labels: Record<string, string> = {
    scenario_unspecified: "场景未指定",
    single_thread_only: "仅单会话证据",
    missing_intent: "缺少显式 intent"
  };

  return (Array.isArray(riskFlags) ? riskFlags : [])
    .map((item) => labels[String(item)] || String(item));
}

function formatCandidateLine(candidate: SessionHabitCandidate, index: number): string {
  const ordinal = index + 1;
  const intent = candidate.suggested_rule?.normalized_intent
    ? `，意图 \`${candidate.suggested_rule.normalized_intent}\``
    : "，尚无显式意图";
  const action = candidate.action === "review_only" ? "复核候选" : "建议添加";
  const score = typeof candidate.confidence === "number" ? candidate.confidence.toFixed(2) : String(candidate.confidence);
  const summary = candidate.confidence_details?.summary
    ? `；${candidate.confidence_details.summary}`
    : "";
  const adjustments = Array.isArray(candidate.confidence_details?.adjustments)
    ? candidate.confidence_details.adjustments
        .filter((item) => item.applied || item.type === "single_thread_limit")
        .map(formatAdjustmentZh)
        .filter(Boolean)
    : [];
  const riskFlags = formatRiskFlagsZh(candidate.risk_flags);
  const tail = [
    adjustments.length > 0 ? `评分依据：${adjustments.join("，")}` : null,
    riskFlags.length > 0 ? `风险：${riskFlags.join("、")}` : null
  ].filter(Boolean).join("；");

  return `${ordinal}. \`${candidate.candidate_id}\`「${candidate.phrase}」${intent}，${action}，置信度 ${score}${summary}${tail ? `；${tail}` : ""}`;
}

function buildSuggestFollowUps(candidates: SessionHabitCandidate[]): string[] {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }

  const prompts: string[] = [];
  const first = candidates[0];
  prompts.push("添加第1条");
  prompts.push("忽略第1条");

  if (first.action === "review_only") {
    prompts.push("把第1条加到 session_close 场景; intent=close_session");
  } else {
    prompts.push("把第1条加到 session_close 场景");
  }

  return prompts;
}

function formatHabitAdditionLine(item: HabitRule, index: number): string {
  const scenario = Array.isArray(item.scenario_bias) && item.scenario_bias.length > 0
    ? item.scenario_bias.join(", ")
    : "general";
  const confidence = typeof item.confidence === "number"
    ? item.confidence.toFixed(2)
    : String(item.confidence ?? "");

  return `${index + 1}. 「${item.phrase}」 -> \`${item.normalized_intent}\`；场景 \`${scenario}\`；置信度 ${confidence}`;
}

function formatSimplePhraseLine(phrase: string, index: number): string {
  return `${index + 1}. 「${phrase}」`;
}

function buildListFollowUps(additions: HabitRule[], removals: string[], ignored: string[]): string[] {
  const prompts: string[] = [];

  if (additions.length > 0) {
    prompts.push(`删除用户习惯短句: ${additions[0].phrase}`);
  }

  if (ignored.length > 0) {
    prompts.push("扫描这次会话里的习惯候选");
  }

  if (prompts.length === 0 && removals.length === 0) {
    prompts.push("扫描这次会话里的习惯候选");
  }

  return prompts;
}

export function buildNextStepAssessment(output: SessionHabitOutput | null | undefined): NextStepAssessment {
  if (!output || typeof output !== "object") {
    return {
      level: "unknown",
      reason: "",
      stop_word: null
    };
  }

  if (output.action === "suggest" && Number(output.candidate_count) === 0) {
    return {
      level: "low_roi",
      reason: "这次扫描没有发现候选，继续停留在习惯短句管理方向的收益通常较低。",
      stop_word: "停"
    };
  }

  if (
    output.action === "apply-candidate" ||
    output.action === "add" ||
    output.action === "remove" ||
    output.action === "ignore-candidate" ||
    output.action === "ignore-phrase"
  ) {
    return {
      level: "low_roi",
      reason: "当前管理动作已经完成，继续沿这个方向多半只是在做补充性整理。",
      stop_word: "停"
    };
  }

  if (output.action === "list") {
    const additions = Array.isArray(output.additions) ? output.additions : [];
    const removals = Array.isArray(output.removals) ? output.removals : [];
    const ignored = Array.isArray(output.ignored_suggestions) ? output.ignored_suggestions : [];

    if (additions.length > 0 || removals.length > 0 || ignored.length > 0) {
      return {
        level: "low_roi",
        reason: "当前列表已经展示了主要状态，继续沿这个方向追问通常比切回主任务更不划算。",
        stop_word: "停"
      };
    }
  }

  return {
    level: "actionable",
    reason: "",
    stop_word: null
  };
}

function appendLowRoiStopHint(markdown: string, assessment: NextStepAssessment): string {
  if (!markdown || assessment.level !== "low_roi" || !assessment.stop_word) {
    return markdown;
  }

  return [
    markdown,
    "",
    "这一步继续做的收益不高，可能不太划算。",
    `如果你想停掉这个方向，直接回 \`${assessment.stop_word}\`。`,
    "我就改看更高价值的 TODO。"
  ].join("\n");
}

function mergeFollowUps(baseFollowUps: string[], assessment: NextStepAssessment): string[] {
  const prompts = Array.isArray(baseFollowUps) ? [...baseFollowUps] : [];

  if (assessment.level === "low_roi" && assessment.stop_word && !prompts.includes(assessment.stop_word)) {
    prompts.unshift(assessment.stop_word);
  }

  return prompts;
}

export function buildLocalStopResponse(request: string | null): SessionHabitOutput & RenderedAssistantReply {
  return {
    action: "stop",
    stop_request: String(request || "").trim(),
    assistant_reply_markdown: "当前这个方向先停。你可以直接切回更高价值的主任务，或之后再回来继续处理习惯短句。",
    suggested_follow_ups: [],
    next_step_assessment: {
      level: "stopped",
      reason: "用户显式要求停止当前方向。",
      stop_word: String(request || "").trim()
    }
  };
}

export function renderAssistantReply(output: SessionHabitOutput): RenderedAssistantReply {
  const assessment = buildNextStepAssessment(output);

  if (!output || typeof output !== "object") {
    return {
      assistant_reply_markdown: "",
      suggested_follow_ups: [],
      next_step_assessment: assessment
    };
  }

  if (output.action === "suggest") {
    if (!Array.isArray(output.candidates) || output.candidates.length === 0) {
      return {
        assistant_reply_markdown: appendLowRoiStopHint(
          "这次会话里没有发现值得加入的用户习惯短句候选。",
          assessment
        ),
        suggested_follow_ups: mergeFollowUps([], assessment),
        next_step_assessment: assessment
      };
    }

    const candidateLines = output.candidates.map(formatCandidateLine);
    const followUps = buildSuggestFollowUps(output.candidates);

    return {
      assistant_reply_markdown: appendLowRoiStopHint([
        `这次会话共发现 ${output.candidate_count} 条习惯候选：`,
        ...candidateLines,
        "",
        "你接下来可以直接说：",
        ...followUps.map((item) => `- \`${item}\``)
      ].join("\n"), assessment),
      suggested_follow_ups: mergeFollowUps(followUps, assessment),
      next_step_assessment: assessment
    };
  }

  if (output.action === "apply-candidate") {
    const appliedRule = output.applied_rule as HabitRule | undefined;
    const scenario = Array.isArray(appliedRule?.scenario_bias)
      ? appliedRule.scenario_bias.join(", ")
      : "general";
    const confidence = typeof appliedRule?.confidence === "number"
      ? appliedRule.confidence.toFixed(2)
      : String(appliedRule?.confidence || "");

    return {
      assistant_reply_markdown: appendLowRoiStopHint(
        `已添加用户习惯短句「${appliedRule?.phrase}」，意图 \`${appliedRule?.normalized_intent}\`，场景 \`${scenario}\`，置信度 ${confidence}。`,
        assessment
      ),
      suggested_follow_ups: mergeFollowUps([
        "列出用户习惯短句",
        `删除用户习惯短句: ${appliedRule?.phrase}`
      ], assessment),
      next_step_assessment: assessment
    };
  }

  if (output.action === "ignore-candidate" || output.action === "ignore-phrase") {
    const phrase = String(output.ignored_phrase || "");
    return {
      assistant_reply_markdown: appendLowRoiStopHint(
        `已忽略短句「${phrase}」，后续扫描将不再重复建议它。`,
        assessment
      ),
      suggested_follow_ups: mergeFollowUps([
        "列出用户习惯短句"
      ], assessment),
      next_step_assessment: assessment
    };
  }

  if (output.action === "list") {
    const additions = Array.isArray(output.additions) ? output.additions as HabitRule[] : [];
    const removals = Array.isArray(output.removals) ? output.removals as string[] : [];
    const ignored = Array.isArray(output.ignored_suggestions) ? output.ignored_suggestions as string[] : [];

    const lines = [
      `当前记录：新增 ${additions.length} 条，移除 ${removals.length} 条，忽略建议 ${ignored.length} 条。`
    ];

    if (additions.length > 0) {
      lines.push("", "新增短句：");
      lines.push(...additions.slice(0, 5).map(formatHabitAdditionLine));
      if (additions.length > 5) {
        lines.push(`还有 ${additions.length - 5} 条新增短句未展开。`);
      }
    }

    if (removals.length > 0) {
      lines.push("", "已移除短句：");
      lines.push(...removals.slice(0, 5).map(formatSimplePhraseLine));
      if (removals.length > 5) {
        lines.push(`还有 ${removals.length - 5} 条移除记录未展开。`);
      }
    }

    if (ignored.length > 0) {
      lines.push("", "已忽略建议：");
      lines.push(...ignored.slice(0, 5).map(formatSimplePhraseLine));
      if (ignored.length > 5) {
        lines.push(`还有 ${ignored.length - 5} 条忽略记录未展开。`);
      }
    }

    if (additions.length === 0 && removals.length === 0 && ignored.length === 0) {
      lines.push("", "当前还没有任何用户习惯短句或忽略记录。");
    }

    return {
      assistant_reply_markdown: appendLowRoiStopHint(lines.join("\n"), assessment),
      suggested_follow_ups: mergeFollowUps(buildListFollowUps(additions, removals, ignored), assessment),
      next_step_assessment: assessment
    };
  }

  if (output.action === "remove") {
    return {
      assistant_reply_markdown: appendLowRoiStopHint(
        `已删除用户习惯短句「${output.removed_phrase}」。`,
        assessment
      ),
      suggested_follow_ups: mergeFollowUps(["列出用户习惯短句"], assessment),
      next_step_assessment: assessment
    };
  }

  if (output.action === "add") {
    const addedRule = output.added_rule as HabitRule | undefined;
    const scenario = Array.isArray(addedRule?.scenario_bias)
      ? addedRule.scenario_bias.join(", ")
      : "general";
    const confidence = typeof addedRule?.confidence === "number"
      ? addedRule.confidence.toFixed(2)
      : String(addedRule?.confidence || "");

    return {
      assistant_reply_markdown: appendLowRoiStopHint(
        `已添加用户习惯短句「${addedRule?.phrase}」，意图 \`${addedRule?.normalized_intent}\`，场景 \`${scenario}\`，置信度 ${confidence}。`,
        assessment
      ),
      suggested_follow_ups: mergeFollowUps(["列出用户习惯短句"], assessment),
      next_step_assessment: assessment
    };
  }

  return {
    assistant_reply_markdown: "",
    suggested_follow_ups: [],
    next_step_assessment: assessment
  };
}

export function forwardToManageHabits(args: SessionHabitCliArgs): never {
  if (LOCAL_STOP_PATTERN.test(args.request || "")) {
    process.stdout.write(`${JSON.stringify(buildLocalStopResponse(args.request), null, 2)}\n`);
    process.exit(0);
  }

  const commandArgs = [
    MANAGE_HABITS_CLI_PATH,
    "--request",
    args.request as string,
    "--user-registry",
    args.registryPath
  ];

  if (Number.isFinite(args.maxCandidates)) {
    commandArgs.push("--max-candidates", String(Math.max(1, Math.trunc(args.maxCandidates))));
  }

  let stdinInput: string | undefined;

  if (args.threadFromStdin) {
    stdinInput = fs.readFileSync(0, "utf8");
    const trimmed = String(stdinInput || "").trim();

    if (!trimmed) {
      throw new Error("--thread-stdin requires non-empty stdin input.");
    }

    commandArgs.push("--transcript-stdin");
  }

  if (args.threadPath) {
    commandArgs.push("--transcript", args.threadPath);
  }

  const result = spawnSync(process.execPath, commandArgs, {
    input: stdinInput,
    encoding: "utf8"
  });

  if (result.stdout) {
    if ((result.status ?? 1) === 0) {
      const parsed = parseJsonOutput(result.stdout);
      const presentation = renderAssistantReply(parsed);
      process.stdout.write(`${JSON.stringify({
        ...parsed,
        ...presentation
      }, null, 2)}\n`);
      process.exit(0);
    }

    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  process.exit(result.status ?? 1);
}

export function main(argv: string[] = process.argv.slice(2)): void {
  const args = parseArgs(argv);
  if (args.help) {
    printUsageAndExit(0, process.stdout);
  }

  validateArgs(args);
  forwardToManageHabits(args);
}

if (require.main === module) {
  main();
}
