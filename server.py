import http.server
import socketserver
import json
import os
import urllib.parse

PORT = 8000
DATA_FILE = 'feedback.json'

class FeedbackHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/feedback':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()

            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, 'r') as f:
                    try:
                        data = json.load(f)
                    except json.JSONDecodeError:
                        data = []
            else:
                data = []

            self.wfile.write(json.dumps(data).encode('utf-8'))
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/feedback':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)

            try:
                new_pin = json.loads(post_data.decode('utf-8'))
            except json.JSONDecodeError:
                self.send_response(400)
                self.end_headers()
                return

            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, 'r') as f:
                    try:
                        data = json.load(f)
                    except json.JSONDecodeError:
                        data = []
            else:
                data = []

            data.append(new_pin)

            with open(DATA_FILE, 'w') as f:
                json.dump(data, f, indent=4)

            self.send_response(201)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_DELETE(self):
        if self.path.startswith('/api/feedback/'):
            pin_id = self.path.split('/')[-1]

            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, 'r') as f:
                    try:
                        data = json.load(f)
                    except json.JSONDecodeError:
                        data = []
            else:
                data = []

            original_len = len(data)
            data = [p for p in data if p.get('id') != pin_id]

            if len(data) < original_len:
                with open(DATA_FILE, 'w') as f:
                    json.dump(data, f, indent=4)
                self.send_response(200)
            else:
                self.send_response(404)

            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), FeedbackHandler) as httpd:
        print(f"Serving on port {PORT}")
        httpd.serve_forever()
