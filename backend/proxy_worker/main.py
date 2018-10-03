#!/usr/bin/env python3

import json

from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ForkingMixIn, TCPServer

class WorkerHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if 'Content-Length' not in self.headers:
            self.send_response(400, "Bad Request")
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(b"Bad Requst - No Content-Length")
            return

        if 'Content-Type' not in self.headers:
            self.send_response(400, "Bad Request")
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(b"Bad Requst - No Content-Type")
            return

        if self.headers["Content-Type"] != "application/json":
            self.send_response(400, "Bad Request")
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(b"Bad Requst - Only JSON accepted")
            return


        content_length = int(self.headers["Content-Length"])
        raw_data = self.rfile.read(content_length)
        try:
            json_data = json.loads(raw_data)
            print(json_data)
            payload = """{"error":0,"message":"Success"}"""
        except json.decoder.JSONDecodeError:
            payload = '{"error":1,"message":"Illegal JSON data"}'

        self.send_response(200, "Success")
        self.send_header("Content-type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(bytes(payload, "UTF-8"))

class ForkHTTPServer(ForkingMixIn, TCPServer):
    allow_reuse_address = True


def run(port=55555, server_class=HTTPServer, handler_class=WorkerHandler):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    except:
        print("")
        print("[!] exception occurs")
        print("")
        import traceback
        traceback.print_exc()
        exit(1)
    httpd.shutdown()
    httpd.server_close()


if __name__ == "__main__":
    run(server_class=ForkHTTPServer)
