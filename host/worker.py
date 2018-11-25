#!/usr/bin/env python3

import errno
import logging
import multiprocessing
import os
import signal
import socket
import struct
import subprocess
import threading
import rwlock

WEBSITE_TIMEOUT = 5

# Protocol Definition
#
# Request
#
# [Header]
# Magic(1byte): \xff
# Option(1byte)
#   \x01: open Chrome
#   \x02: open Firefox
#   \x03: open IE(Windows only)
#   \x04: open Safari(Mac only)
# Body Length(4byte, big-endian)
#
# [Body]
# Target website
#
#
# Response
#
# [Header]
# Magic(1byte): \xfe
#
# [Body]
# Code(1byte)
#   \x00: success
#   \x01: fail

class ProtocolError(Exception):
    pass

def open_browser(conn, address, browsers, environ, logger, lock):
    try:
        # parse header
        if conn.recv(1) != b"\xff":
            raise ProtocolError("Illegal magic number")
        option = conn.recv(1)
        if option not in browsers:
            raise ProtocolError("Illegal option")
        body_length = struct.unpack(">I", conn.recv(4))[0]

        res = body_length
        body = b""
        while res > 0:
            data = conn.recv(1024 if res > 1024 else res)
            res -= len(data)
            body += data

        # do something...
        # TODO: implement web browser execution
        with rwlock.ReadRWLock(lock):
            if option == b"\x01":
                subprocess.Popen([browsers[option],
                                 "--allow-running-insecure-content",
                                 "--ignore-certificate-errors",
                                 "--ignore-urlfetcher-cert-requests",
                                 "--disable-gpu", "--enable-logging=stderr",
                                 "--v=2", "--no-sandbox",
                                 body.decode("utf-8")], env=environ)
            elif option == b"\x02":
                subprocess.Popen([browsers[option], body.decode("utf-8")], env=environ)
            elif option == b"\x03":
                subprocess.Popen([browsers[option], body.decode("utf-8")], env=environ)
            elif option == b"\x04":
                subprocess.Popen(["/usr/bin/open", "-a", browsers[option], body.decode("utf-8")], env=environ)
            else:
                raise ValueError("Illegal option value passed")

        conn.sendall(b"\xfe\x00")
    except ProtocolError as e:
        logger.exception("Protocol error occured: {}".format(str(e)))
        conn.sendall(b"\xfe\x01")
    except IOError:
        logger.exception("IO error... maybe connection loss")

def manager(timeout, lock):
    import time
    import platform
    system = platform.system()
    while True:
        time.sleep(2 * timeout)
        with rwlock.WriteRWLock(lock):
            time.sleep(WEBSITE_TIMEOUT)
            if system == "Windows":
                os.system("taskkill /F /im iexplore.exe /im firefox.exe /im chrome.exe")
            elif system == "Linux":
                os.system("killall chrome firefox")
            elif system == "Darwin":
                os.system("killall Google\\ Chrome firefox Safari")
            else:
                raise Exception("Unknown os: {}".format(system))

def handle(conn, address, browsers, environ, timeout, lock):
    logging.basicConfig(level=logging.DEBUG)
    logger = logging.getLogger("process-{}".format(address))
    logger.debug("Connected {} at {}".format(conn, address))
    t = threading.Thread(target=open_browser, args=(conn, address, browsers, environ, logger, lock))
    t.start()
    t.join(timeout)
    if t.is_alive():
        logger.exception("Timeout error occured")
        conn.sendall(b"\xfe\x01")
    logger.debug("Closing {}".format(address))
    conn.close()

class WorkerServer:
    def __init__(self, host, port, timeout=30):
        self.logger = logging.getLogger("WorkerServer")
        self._host = host
        self._port = port
        self._timeout = timeout
        import platform
        system = platform.system()
        if system == "Windows":
            self.browsers = {
                b"\x01": "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
                b"\x02": "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
                b"\x03": "C:\\Program Files\\Internet Explorer\\iexplore.exe"
            }
            self.environ = dict(os.environ)
        elif system == "Linux":
            self.browsers = {
                b"\x01": "/usr/bin/google-chrome",
                b"\x02": "/usr/bin/firefox"
            }
            self.environ = dict(os.environ)
            self.environ["DISPLAY"] = ":1"
            subprocess.call("./linux-vscreen.sh")
        elif system == "Darwin":
            self.browsers = {
                b"\x01": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                b"\x02": "/Applications/Firefox.app/Contents/MacOS/firefox",
                #b"\x04": "/Applications/Safari.app/Contents/MacOS/Safari"
                b"\x04": "Safari"
            }
            self.environ = dict(os.environ)
        else:
            raise Exception("Unknown os: {}".format(system))
        del system
        del platform

    def start(self):
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.bind((self._host, self._port))
        self.socket.listen(16)
        self.logger.debug("Start to listen")

        lock = rwlock.RWLock()
        process = multiprocessing.Process(target=manager, args=(self._timeout, lock))
        process.daemon = True
        process.start()

        while True:
            conn, address = self.socket.accept()
            self.logger.debug("Accepted {}".format(address))
            process = multiprocessing.Process(target=handle, args=(conn, address, self.browsers, self.environ, self._timeout, lock))
            process.daemon = True
            process.start()
            self.logger.debug("Process {} started".format(process))

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    server = WorkerServer("0.0.0.0", 31333, timeout=30)
    try:
        logging.info("Server up")
        server.start()
    except:
        logging.exception("Unexpected exception")
    finally:
        logging.info("Shutting down...")
        for process in multiprocessing.active_children():
            logging.info("Shutting down process {}".format(process))
            process.terminate()
            process.join()
    logging.info("Server down")
