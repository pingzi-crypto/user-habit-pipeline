const { interpretHabit } = require("user-habit-pipeline");

const result = interpretHabit({
  message: "继续",
  scenario: "general",
  recent_context: ["继续当前发布收尾"]
});

process.stdout.write(`${JSON.stringify({
  integration_path: "direct-library",
  normalized_intent: result.normalized_intent,
  confidence: result.confidence,
  should_ask_clarifying_question: result.should_ask_clarifying_question
}, null, 2)}\n`);
