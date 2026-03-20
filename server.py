import http.server
import socketserver
import urllib.parse
import json
import os
import csv

PORT = 8000
CSV_FILE = os.path.join("data", "guests.csv")

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        if self.path == '/api/images':
            images_dir = os.path.join("assets", "images")
            images = []
            if os.path.exists(images_dir):
                for f in os.listdir(images_dir):
                    if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.heic')):
                        images.append(f)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(images).encode('utf-8'))
            return
        super().do_GET()

    def do_POST(self):
        if self.path == '/api/update_guest':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(post_data)
                target_fullname = data.get('fullname', '').strip().lower()
                updates = data.get('updates', {})
                
                rows = []
                updated = False
                
                # Check if file exists, if not create with headers
                if not os.path.exists(CSV_FILE):
                    with open(CSV_FILE, 'w', encoding='utf-8') as f:
                        f.write("nome;cognome;confermato;punteggio\n")
                
                with open(CSV_FILE, 'r', encoding='utf-8') as f:
                    reader = csv.reader(f, delimiter=';')
                    headers = next(reader, None)
                    if headers is None or "confermato" not in headers:
                        headers = ["nome", "cognome", "confermato", "punteggio"]
                    rows.append(headers)
                    
                    for row in reader:
                        while len(row) < 4:
                            row.append("")
                        
                        row_name = row[0].strip()
                        row_surname = row[1].strip()
                        row_fullname = f"{row_name} {row_surname}".lower()
                        
                        if row_fullname == target_fullname:
                            if 'confermato' in updates:
                                row[2] = str(updates['confermato'])
                            if 'punteggio' in updates:
                                row[3] = str(updates['punteggio'])
                            updated = True
                        rows.append(row)
                        
                if updated:
                    with open(CSV_FILE, 'w', encoding='utf-8', newline='') as f:
                        writer = csv.writer(f, delimiter=';')
                        writer.writerows(rows)
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
                else:
                    self.send_response(404)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "error": "Guest not found"}).encode('utf-8'))
                    
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

# Allow address reuse
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
    print(f"Serving at port {PORT} with API endpoints")
    httpd.serve_forever()
