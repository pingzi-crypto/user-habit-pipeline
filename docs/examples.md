<!-- Generated from tests/fixtures/examples.json. Run `npm run generate-examples-doc` after editing fixtures. -->

# Examples

## Example 1

### Input
- message: `帮我入板`
- scenario: `reviewer`

### Expected Output
- normalized_intent: `add_or_update_board_item`
- should_ask_clarifying_question: `false`

### Why
This is a stable shorthand for board action, not for general planning.

---

## Example 2

### Input
- message: `更新入板`
- scenario: `status_board`

### Expected Output
- normalized_intent: `add_or_update_board_item`
- should_ask_clarifying_question: `false`

### Why
The phrase strongly implies updating an existing board entry.

---

## Example 3

### Input
- message: `验收`
- scenario: `reviewer`

### Expected Output
- normalized_intent: `review_acceptance`
- should_ask_clarifying_question: `false`

### Why
In this workflow, the phrase typically means reviewer-side acceptance check.

---

## Example 4

### Input
- message: `session-close`
- scenario: `session_close`

### Expected Output
- normalized_intent: `close_session`
- should_ask_clarifying_question: `false`

### Why
This is an explicit request to close the current session.

---

## Example 5

### Input
- message: `下一条`
- scenario: `status_board`

### Expected Output
- normalized_intent: `move_to_next_item`
- should_ask_clarifying_question: `false`

### Why
Within board-oriented context, this usually means move to the next active item.

---

## Example 6

### Input
- message: `继续`
- scenario: `general`

### Expected Output
- normalized_intent: `continue_current_track`
- should_ask_clarifying_question: `true`
- confidence: less than `0.8`

### Why
The phrase is high-frequency but under-specified and should not be overcommitted without context.

---

## Example 7

### Input
- message: `提示词`
- scenario: `general`

### Expected Output
- normalized_intent: `draft_text_artifact`
- should_ask_clarifying_question: `false`

### Why
This usually means draft or revise prompt text, not execute implementation.

---

## Example 8

### Input
- message: `请帮我更新入板`
- scenario: `status_board`

### Expected Output
- normalized_intent: `add_or_update_board_item`
- top habit match phrase: `更新入板`
- should_ask_clarifying_question: `false`

### Why
When a longer and shorter shorthand overlap, the longer phrase should win.

---

## Example 9

### Input
- message: `请继续评审这个任务`
- scenario: `reviewer`

### Expected Output
- normalized_intent: `continue_current_track`
- top habit match phrase: `继续评审`
- should_ask_clarifying_question: `false`

### Why
An explicit reviewer-track phrase should outrank the shorter ambiguous phrase `继续`.

---

## Example 10

### Input
- message: `继续`
- scenario: `general`
- recent_context:
  - `继续当前评审`
  - `review the next issue after this`

### Expected Output
- normalized_intent: `continue_current_track`
- should_ask_clarifying_question: `true`
- confidence: greater than `0.7`

### Why
Recent context may support an existing ambiguous shorthand, but should not remove the need for conservative interpretation.

---

## Example 11

### Input
- message: `去处理一下`

### Expected Output
- normalized_intent: `unknown`
- should_ask_clarifying_question: `true`

### Why
The interpreter should not invent a workflow hint when no explicit shorthand rule matches.
