#!/usr/bin/env python3
import sys
import json
import urllib.request
import os

API_KEY = os.environ.get("STITCH_API_KEY", "")
SERVER_URL = "https://stitch.googleapis.com/mcp"

def call_stitch(tool_name, arguments=None):
    payload = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments or {}
        },
        "id": 1
    }
    req = urllib.request.Request(
        SERVER_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "X-Goog-Api-Key": API_KEY,
            "Content-Type": "application/json"
        }
    )
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode("utf-8"))
        return data

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: stitch_client.py <tool_name> [json_arguments]")
        sys.exit(1)

    tool = sys.argv[1]
    args = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    result = call_stitch(tool, args)
    print(json.dumps(result, indent=2))
