import http.server
import socketserver
import json
import datetime

class MockLogHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        log_data = {
            "message": f"Test log generated at {datetime.datetime.now().isoformat()}",
            "level": "INFO",
            "timestamp": datetime.datetime.now().isoformat(),
            "sourceService": "my-mock-service"
        }
        self.wfile.write(json.dumps(log_data).encode())

PORT = 8085
with socketserver.TCPServer(("", PORT), MockLogHandler) as httpd:
    print(f"Serving mock logs at port {PORT}")
    httpd.serve_forever()
