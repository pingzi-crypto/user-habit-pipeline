import json
import urllib.request

BASE_URL = "http://127.0.0.1:4848"


def post_json(path, payload):
    request = urllib.request.Request(
        url=f"{BASE_URL}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(request) as response:
        return json.loads(response.read().decode("utf-8"))


interpret_result = post_json(
    "/interpret",
    {
        "message": "继续",
        "scenario": "general",
    },
)

manage_result = post_json(
    "/manage",
    {
        "request": "添加用户习惯短句: phrase=收尾一下; intent=close_session; 场景=session_close; 置信度=0.86"
    },
)

print(
    json.dumps(
        {
            "integration_path": "python-http",
            "normalized_intent": interpret_result["result"]["normalized_intent"],
            "manage_action": manage_result["result"]["action"],
        },
        ensure_ascii=False,
        indent=2,
    )
)
