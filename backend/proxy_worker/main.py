#!/usr/bin/env python3

import json
import os
import pymysql

from DBUtils.PooledDB import PooledDB, TooManyConnections
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn, TCPServer

class WorkerHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        global pool
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
            db = pool.connection()
            cur = db.cursor()
            cur.execute("INSERT INTO test (json) VALUES ('{}')".format(raw_data.decode("UTF-8")))
            db.commit()
            del cur
            del db
            payload = """{"error":0,"message":"Success"}"""
        except json.decoder.JSONDecodeError:
            payload = '{"error":1,"message":"Illegal JSON data"}'
        except TooManyConnections:
            payload = '{"error":255,"message":"Too much traffic"}'

        self.send_response(200, "Success")
        self.send_header("Content-type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(bytes(payload, "UTF-8"))

class ThreadedHTTPServer(ThreadingMixIn, TCPServer):
    allow_reuse_address = True


def init():
    global pool
    host = os.environ.get("DB_HOST", "192.168.0.255")
    port = int(os.environ.get("DB_PORT", "3306"))
    dbname = os.environ.get("DB_DATABASE", "webspector")
    user = os.environ.get("DB_USER", "dbadmin")
    passwd = os.environ.get("DB_PASSWORD", "dbadminpassword")

    pool = PooledDB(pymysql, mincached=4, host=host, port=port, db=dbname, \
                    user=user, passwd=passwd)

def fini():
    global pool
    del pool

def run(port=55555, server_class=HTTPServer, handler_class=WorkerHandler):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    init()
    try:
        print("[*] Server Started")
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
    print("")
    print("[*] Server Ended")
    fini()


if __name__ == "__main__":
    run(int(os.environ.get("PROXY_WORKER_PORT", "55555")), server_class=ThreadedHTTPServer)
