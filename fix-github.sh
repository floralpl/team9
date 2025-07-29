#!/bin/bash
# save as fix-github.sh

# Windows版本
ipconfig /flushdns
netsh interface tcp set global autotuninglevel=normal
git config --global http.postBuffer 2147483647
git config --global http.sslBackend "openssl"
git config --global http.sslCAInfo "C:/Program Files/Git/mingw64/ssl/certs/ca-bundle.crt"
