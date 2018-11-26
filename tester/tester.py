#!/usr/bin/env python2

from pwn import remote, p32

import time
import sys

def main(file):
    try:
        with open(file, "r") as f:
            websites = f.readlines()

        count = 0
        total = 0
        for website in websites:
            website = website.strip()
            if count > 4:
                total += count
                count = 0
                print "Now: {}/{}".format(total, len(websites))
                time.sleep(3)
            for browser in ["\x01", "\x02"]:
                p = remote("ec2-54-180-94-105.ap-northeast-2.compute.amazonaws.com", 31333)
                payload = "\xff"
                payload += browser
                payload += p32(len(website), endian="big")
                payload += website
                p.send(payload)
                p.close()

            for browser in ["\x01", "\x02", "\x03"]:
                p = remote("ec2-13-125-153-202.ap-northeast-2.compute.amazonaws.com", 31333)
                payload = "\xff"
                payload += browser
                payload += p32(len(website), endian="big")
                payload += website
                p.send(payload)
                p.close()

            for browser in ["\x01", "\x02", "\x04"]:
                p = remote("143.248.2.114", 31333)
                payload = "\xff"
                payload += browser
                payload += p32(len(website), endian="big")
                payload += website
                p.send(payload)
                p.close()
            count += 1
            time.sleep(1)
    except IOError as e:
        print >> sys.stderr, str(e)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print >> sys.stderr, "Usage: {} <website list file>".format(sys.argv[0])
        exit(1)
    main(sys.argv[1])
