#!/usr/bin/env python3
import sys
import json
import urllib.request
import urllib.parse
import os

MCP_URL = "https://mcp.icons8.com/mcp/"
SEARCH_API = "https://search.icons8.com/api/iconsets/v5/search"
IMG_CDN = "https://img.icons8.com/"

TOKEN_FILE = os.path.expanduser("~/.gemini/antigravity/icons8_token.json")
LOCK_FILE = os.path.join(os.path.dirname(__file__), "..", "icons8.json")

def get_token():
    if os.path.exists(TOKEN_FILE):
        try:
            with open(TOKEN_FILE, "r") as f:
                return json.load(f).get("access_token")
        except Exception:
            return None
    return None

def load_lock():
    if os.path.exists(LOCK_FILE):
        with open(LOCK_FILE, "r") as f:
            return json.load(f)
    return {"icons": {"pack": "material_rounded", "items": {}}}

def call_mcp(tool_name, arguments=None):
    token = get_token()
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

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
        MCP_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode("utf-8"))

def search_icons(query, platform=None, amount=10):
    # Coba via MCP dulu
    try:
        args = {"query": query, "amount": amount}
        if platform:
            args["platform"] = platform
        res = call_mcp("search_icons", args)
        if "result" in res and "content" in res["result"]:
            content = res["result"]["content"]
            if isinstance(content, list) and len(content) > 0:
                text = content[0].get("text", "")
                return json.loads(text) if text.startswith("[") or text.startswith("{") else text
    except Exception:
        pass

    # Fallback ke direct catalog API
    params = {"term": query, "amount": amount}
    if platform:
        params["platform"] = platform
    url = f"{SEARCH_API}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "PatakLogistics/1.0"})
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode("utf-8"))
        return data.get("icons", [])

def get_icon_preview_url(icon_id, size=48, color="000000"):
    return f"{IMG_CDN}?size={size}&id={icon_id}&format=png&color={color}"

def lock_icon(common_name, icon_id, pack=None):
    data = load_lock()
    if pack:
        data["icons"]["pack"] = pack
    data["icons"]["items"][common_name] = {
        "id": str(icon_id),
        "commonName": common_name,
        "preview": get_icon_preview_url(icon_id)
    }
    with open(LOCK_FILE, "w") as f:
        json.dump(data, f, indent=2)
    return data["icons"]["items"][common_name]

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: icons8_client.py search <keyword> [amount]")
        print("       icons8_client.py lock <common_name> <icon_id>")
        print("       icons8_client.py list-locked")
        print("       icons8_client.py mcp-call <tool_name> [args_json]")
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "search":
        term = sys.argv[2] if len(sys.argv) > 2 else "dashboard"
        amount = int(sys.argv[3]) if len(sys.argv) > 3 else 5
        results = search_icons(term, amount=amount)
        if isinstance(results, list):
            print(f"Found {len(results)} icons for '{term}':")
            for ic in results:
                print(f"- ID: {ic.get('id')} | Name: {ic.get('name')} | Platform: {ic.get('platform')} | Preview: {get_icon_preview_url(ic.get('id', ''))}")
        else:
            print(json.dumps(results, indent=2))
    elif cmd == "lock":
        cname = sys.argv[2]
        iid = sys.argv[3]
        item = lock_icon(cname, iid)
        print(f"Locked icon '{cname}' (ID: {iid}):\n{json.dumps(item, indent=2)}")
    elif cmd == "list-locked":
        lock = load_lock()
        print(json.dumps(lock.get("icons", {}), indent=2))
    elif cmd == "mcp-call":
        tool = sys.argv[2]
        args = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
        res = call_mcp(tool, args)
        print(json.dumps(res, indent=2))
