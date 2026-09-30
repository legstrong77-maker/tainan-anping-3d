# 本機預覽伺服器：提供 dist/ 靜態檔，並接受 POST /save?name=xxx.png 把畫面存到 shots/（檢查畫面、錄影用）
import http.server, os, sys, urllib.parse, base64

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
SHOTS = os.path.join(ROOT, 'shots')
os.makedirs(SHOTS, exist_ok=True)

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=DIST, **k)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        q = urllib.parse.urlparse(self.path)
        name = urllib.parse.parse_qs(q.query).get('name', ['frame.png'])[0]
        name = os.path.basename(name)
        sub = urllib.parse.parse_qs(q.query).get('dir', [''])[0]
        folder = os.path.join(SHOTS, os.path.basename(sub)) if sub else SHOTS
        os.makedirs(folder, exist_ok=True)
        n = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(n)
        if body.startswith(b'data:'):
            body = base64.b64decode(body.split(b',', 1)[1])
        with open(os.path.join(folder, name), 'wb') as f:
            f.write(body)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'ok')

    def log_message(self, *a):
        pass

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8791
class S(http.server.ThreadingHTTPServer):
    request_queue_size = 128
    daemon_threads = True
    allow_reuse_address = True

S(('127.0.0.1', port), H).serve_forever()
