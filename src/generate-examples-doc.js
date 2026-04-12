#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXAMPLES_DOC_PATH = exports.EXAMPLES_FIXTURE_PATH = void 0;
exports.renderExamplesDoc = renderExamplesDoc;
exports.main = main;
const fs = require("node:fs");
const path = require("node:path");
exports.EXAMPLES_FIXTURE_PATH = path.join(__dirname, "..", "tests", "fixtures", "examples.json");
exports.EXAMPLES_DOC_PATH = path.join(__dirname, "..", "docs", "examples.md");
function normalizeLineEndings(text) {
    return text.replace(/\r\n/g, "\n");
}
function formatInput(input) {
    const lines = [];
    if (typeof input.message === "string") {
        lines.push(`- message: \`${input.message}\``);
    }
    if (typeof input.scenario === "string") {
        lines.push(`- scenario: \`${input.scenario}\``);
    }
    if (Array.isArray(input.recent_context) && input.recent_context.length > 0) {
        lines.push("- recent_context:");
        for (const contextItem of input.recent_context) {
            lines.push(`  - \`${contextItem}\``);
        }
    }
    return lines;
}
function formatExpected(expected) {
    const lines = [];
    if (typeof expected.normalized_intent === "string") {
        lines.push(`- normalized_intent: \`${expected.normalized_intent}\``);
    }
    if (typeof expected.top_phrase === "string") {
        lines.push(`- top habit match phrase: \`${expected.top_phrase}\``);
    }
    if (typeof expected.should_ask_clarifying_question === "boolean") {
        lines.push(`- should_ask_clarifying_question: \`${String(expected.should_ask_clarifying_question)}\``);
    }
    if (typeof expected.confidence_gt === "number") {
        lines.push(`- confidence: greater than \`${expected.confidence_gt}\``);
    }
    if (typeof expected.confidence_lt === "number") {
        lines.push(`- confidence: less than \`${expected.confidence_lt}\``);
    }
    return lines;
}
function renderExamplesDoc(fixtures) {
    const lines = [
        "<!-- Generated from tests/fixtures/examples.json. Run `npm run generate-examples-doc` after editing fixtures. -->",
        "",
        "# Examples",
        ""
    ];
    fixtures.forEach((fixture, index) => {
        lines.push(`## Example ${index + 1}`);
        lines.push("");
        lines.push("### Input");
        lines.push(...formatInput(fixture.input));
        lines.push("");
        lines.push("### Expected Output");
        lines.push(...formatExpected(fixture.expected));
        lines.push("");
        lines.push("### Why");
        lines.push(fixture.why);
        if (index < fixtures.length - 1) {
            lines.push("");
            lines.push("---");
            lines.push("");
        }
    });
    lines.push("");
    return lines.join("\n");
}
function readFixtures() {
    return JSON.parse(fs.readFileSync(exports.EXAMPLES_FIXTURE_PATH, "utf8"));
}
function main(argv = process.argv.slice(2)) {
    const checkOnly = argv.includes("--check");
    const content = renderExamplesDoc(readFixtures());
    if (checkOnly) {
        const current = fs.readFileSync(exports.EXAMPLES_DOC_PATH, "utf8");
        if (normalizeLineEndings(current) !== normalizeLineEndings(content)) {
            process.stderr.write("docs/examples.md is out of date. Run `npm run generate-examples-doc`.\n");
            process.exit(1);
        }
        process.stdout.write("docs/examples.md is up to date.\n");
        return;
    }
    fs.writeFileSync(exports.EXAMPLES_DOC_PATH, content, "utf8");
    process.stdout.write(`Wrote ${exports.EXAMPLES_DOC_PATH}\n`);
}
if (require.main === module) {
    main();
}
