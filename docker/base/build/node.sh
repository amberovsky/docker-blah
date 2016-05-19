#!/usr/bin/env bash

set -e

apt-get install -y curl
curl -sL https://deb.nodesource.com/setup_6.x | bash -
apt-get purge -y curl

apt-get install -y nodejs
npm update npm

npm install -g \
    ip@1.1.3 \
    body-parser@1.15.1 \
    cookie-parser@1.4.1 \
    dockerode@2.2.10 \
    express@4.13.4 \
    express-session@1.13.0 \
    fs@0.0.2 \
    sqlite3@3.1.4 \
    nunjucks@2.4.2 \
    connect-redis@3.0.2 \
    winston@2.2.0 \
    multer@1.1.0 \
    socket.io@1.4.6 \
    passport@0.3.2 \
    passport-local@1.0.0 \
    passport.socketio@3.6.1
