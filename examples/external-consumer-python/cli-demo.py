import json
import subprocess


def run_json_command(arguments):
    completed = subprocess.run(
        arguments,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout)


interpret_result = run_json_command(
    [
        "npm",
        "exec",
        "--",
        "user-habit-pipeline",
        "--message",
        "继续",
        "--scenario",
        "general",
    ]
)

manage_result = run_json_command(
    [
        "npm",
        "exec",
        "--",
        "manage-user-habits",
        "--request",
        "添加用户习惯短句: phrase=收尾一下; intent=close_session; 场景=session_close; 置信度=0.86",
    ]
)

print(
    json.dumps(
        {
            "integration_path": "python-cli",
            "normalized_intent": interpret_result["normalized_intent"],
            "manage_action": manage_result["action"],
        },
        ensure_ascii=False,
        indent=2,
    )
)
