#!/bin/bash

openssl genrsa -aes256 -out hostkey.pem 2048 \
  && openssl rsa -in hostkey.pem -out hostkey_decrypted.pem \
  && chmod 0600 hostkey*.pem \
  && openssl req -new -key hostkey_decrypted.pem -out host.csr \
  -config host.conf \
  && openssl x509 -req -days 365 -extensions v3_user -in host.csr \
  -CA ../../../cert/rootCA.crt -CAcreateserial \
  -CAkey ../../../cert/rootCAkey.pem -out host.crt -extfile host.conf
