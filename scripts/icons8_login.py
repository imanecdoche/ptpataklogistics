#!/usr/bin/env python3
import http.server
import socketserver
import urllib.parse
import urllib.request
import os
import sys
import json
import base64
import hashlib
import secrets
import subprocess

PORT = 8765
REDIRECT_URI = f"http://127.0.0.1:{PORT}/callback"
REGISTER_URL = "https://mcp.icons8.com/register"
AUTH_URL = "https://mcp.icons8.com/authorize"
TOKEN_URL = "https://mcp.icons8.com/token"

TOKEN_FILE = os.path.expanduser("~/.gemini/antigravity/icons8_token.json")
ANTIGRAVITY_MCP_CONFIG = os.path.expanduser("~/.gemini/antigravity/mcp_config.json")
GLOBAL_MCP_CONFIG = os.path.expanduser("~/.gemini/config/mcp_config.json")

def generate_pkce():
    verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode("utf-8").rstrip("=")
    digest = hashlib.sha256(verifier.encode("utf-8")).digest()
    challenge = base64.urlsafe_b64encode(digest).decode("utf-8").rstrip("=")
    return verifier, challenge

def register_client():
    payload = {
        "client_name": "PatakLogisticsAgent",
        "redirect_uris": [REDIRECT_URI]
    }
    req = urllib.request.Request(
        REGISTER_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode("utf-8"))

def exchange_code(client_id, client_secret, code, verifier):
    data = urllib.parse.urlencode({
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": client_id,
        "client_secret": client_secret,
        "code_verifier": verifier
    }).encode("utf-8")

    req = urllib.request.Request(
        TOKEN_URL,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode("utf-8"))

def update_mcp_configs(token_data):
    access_token = token_data.get("access_token")
    if not access_token:
        return

    # Save token file
    os.makedirs(os.path.dirname(TOKEN_FILE), exist_ok=True)
    with open(TOKEN_FILE, "w") as f:
        json.dump(token_data, f, indent=2)

    # Update mcp configs with Authorization header
    for cfg_path in [ANTIGRAVITY_MCP_CONFIG, GLOBAL_MCP_CONFIG]:
        if os.path.exists(cfg_path):
            try:
                with open(cfg_path, "r") as f:
                    cfg = json.load(f)
                if "mcpServers" in cfg and "icons8" in cfg["mcpServers"]:
                    cfg["mcpServers"]["icons8"]["headers"] = {
                        "Authorization": f"Bearer {access_token}"
                    }
                    with open(cfg_path, "w") as f:
                        json.dump(cfg, f, indent=2)
            except Exception as e:
                print(f"Gagal update {cfg_path}: {e}")

class CallbackHandler(http.server.BaseHTTPRequestHandler):
    client_info = None
    verifier = None
    state = None
    token_result = None

    def log_message(self, format, *args):
        pass  # Quiet logging

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/callback":
            qs = urllib.parse.parse_qs(parsed.query)
            code = qs.get("code", [None])[0]
            received_state = qs.get("state", [None])[0]

            if received_state != CallbackHandler.state or not code:
                self.send_response(400)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(b"<h1>Autentikasi Gagal</h1><p>State tidak cocok atau kode otorisasi tidak ditemukan.</p>")
                return

            try:
                token_data = exchange_code(
                    CallbackHandler.client_info["client_id"],
                    CallbackHandler.client_info.get("client_secret", ""),
                    code,
                    CallbackHandler.verifier
                )
                CallbackHandler.token_result = token_data
                update_mcp_configs(token_data)

                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                html = (
                    "<html><body style='font-family:sans-serif;text-align:center;padding:40px;'>"
                    "<h1 style='color:#16a34a;'>Login Berhasil!</h1>"
                    "<p>Icons8 MCP Server telah terautentikasi dan siap digunakan.</p>"
                    "<p>Anda dapat menutup tab browser ini sekarang.</p>"
                    "</body></html>"
                )
                self.wfile.write(html.encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(f"<h1>Error saat menukar token</h1><p>{e}</p>".encode("utf-8"))

def main():
    print("Mendaftarkan client sementara ke Icons8 MCP...")
    client_info = register_client()
    client_id = client_info["client_id"]

    verifier, challenge = generate_pkce()
    state = secrets.token_hex(16)

    CallbackHandler.client_info = client_info
    CallbackHandler.verifier = verifier
    CallbackHandler.state = state

    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": REDIRECT_URI,
        "scope": "icons8",
        "state": state,
        "code_challenge": challenge,
        "code_challenge_method": "S256"
    }
    login_url = f"{AUTH_URL}?{urllib.parse.urlencode(params)}"

    print("\n" + "=" * 60)
    print("LINK LOGIN AUTENTIKASI ICONS8 MCP:")
    print(login_url)
    print("=" * 60 + "\n")

    # Coba buka di browser lokal jika ada xdg-open
    try:
        subprocess.Popen(["xdg-open", login_url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("Membuka browser otomatis...")
    except Exception:
        pass

    with socketserver.TCPServer(("127.0.0.1", PORT), CallbackHandler) as httpd:
        print(f"Menunggu callback di {REDIRECT_URI}...")
        while CallbackHandler.token_result is None:
            httpd.handle_request()

    print("\nToken berhasil diterima dan disimpan!")
    print(f"File token: {TOKEN_FILE}")
    print("Konfigurasi MCP telah diperbarui dengan Bearer token.")

if __name__ == "__main__":
    main()
