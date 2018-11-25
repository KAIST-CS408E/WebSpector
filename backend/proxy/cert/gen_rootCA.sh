#!/bin/bash

openssl genrsa -aes256 -out rootCAkey.pem 2048 \
  && chmod 0600 rootCAkey.pem \
  && openssl req -new -key rootCAkey.pem -out rootCA.csr -config rootCA.conf \
  && openssl x509 -req -days 3650 -extensions v3_ca -set_serial 1 \
  -in rootCA.csr -signkey rootCAkey.pem -out rootCA.crt -extfile rootCA.conf
