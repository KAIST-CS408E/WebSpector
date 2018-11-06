#!/usr/bin/python3

import sys
import os
from string import Template

dirname, filename = os.path.split(os.path.abspath(__file__))

class Reproducer(object):

    def __init__ (self):
        with open(os.path.join(dirname, 'prev_instrument_ob.js'), 'r') as fp:
            self.prev_script = Template(fp.read())

    # instrument_file : change js script (filedata) to instrumented js script
    # filename is required to make variables to track origin
    def instrument_file(self, filename, filedata, target_server):
        return self.prev_script.substitute(proxy_dest = target_server) + filedata


if __name__ == "__main__":
    # test stdin
    print(Reproducer().instrument_file("temp.js", sys.stdin.read()))
