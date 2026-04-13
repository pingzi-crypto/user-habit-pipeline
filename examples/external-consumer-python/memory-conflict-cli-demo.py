import json
import os
import shutil
import subprocess


def npm_command():
    return "npm.cmd" if os.name == "nt" else "npm"


def resolve_cli_command(bin_name, repo_script_relative_path):
    repo_script_path = os.path.join(os.getcwd(), repo_script_relative_path)
    if os.path.exists(repo_script_path):
        return [shutil.which("node") or "node", repo_script_path]

    return [npm_command(), "exec", "--", bin_name]


def run_json_command(arguments):
    completed = subprocess.run(
        arguments,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout)


pre_action_result = run_json_command(
    resolve_cli_command("user-habit-pipeline", os.path.join("src", "cli.js"))
    + [
        "--message",
        "读取最新状态板",
        "--scenario",
        "status_board",
        "--external-memory-intent",
        "close_session",
        "--external-memory-source",
        "host_local_memory",
        "--external-memory-confidence",
        "0.91",
    ]
)

print(
    json.dumps(
        {
            "integration_path": "python-cli-memory-conflict",
            "pipeline_intent": pre_action_result["result"]["normalized_intent"],
            "pipeline_next_action": pre_action_result["pre_action_decision"]["next_action"],
            "memory_conflict_detected": pre_action_result["memory_conflict_decision"]["memory_conflict_detected"],
            "final_next_action": pre_action_result["memory_conflict_decision"]["final_next_action"],
            "recommended_resolution": pre_action_result["memory_conflict_decision"]["recommended_resolution"],
        },
        ensure_ascii=False,
        indent=2,
    )
)
