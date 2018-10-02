from proxy_util import *
from ..instrument.reproducer import *

class JSInterceptProxyHandler(ProxyRequestHandler):

    def __init__(self, *args, **kwargs):
        self.reproducer = Reproducer()
        ProxyRequestHandler.__init__(self, *args, **kwargs)

    def response_handler(self, req, req_body, res, res_body):
        if 'Content-Type' in res.headers and res.headers['Content-type'] in ['text/javascript', 'application/javascript']:
            u = urlparse.urlsplit(req.path)
            return self.handle_js(u.path, res_body)
        return None

    def handle_js(self, js_name, js_data):
        return self.reproducer.instrument_file(js_name, js_data)



def test(HandlerClass=JSInterceptProxyHandler, ServerClass=ThreadingHTTPServer, protocol="HTTP/1.1"):
    if sys.argv[1:]:
        port = int(sys.argv[1])
    else:
        port = 8080
    server_address = ('0.0.0.0', port)

    HandlerClass.protocol_version = protocol
    httpd = ServerClass(server_address, HandlerClass)

    sa = httpd.socket.getsockname()
    print "Serving HTTP Proxy on", sa[0], "port", sa[1], "..."
    httpd.serve_forever()


if __name__ == '__main__':
    test()
