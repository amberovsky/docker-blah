#!/usr/bin/env bash

set -e

apt-get install -y curl
curl -sL https://deb.nodesource.com/setup_6.x | bash -
apt-get purge -y curl

apt-get install -y nodejs
npm update npm

npm install -g \
    ip@1.1.3 \
    body-parser@1.15.2 \
    cookie-parser@1.4.3 \
    dockerode@2.3.1 \
    express@4.14.0 \
    express-session@1.14.1 \
    sqlite3@3.1.4 \
    nunjucks@2.5.0 \
    connect-redis@3.1.0 \
    winston@2.2.0 \
    multer@1.2.0 \
    socket.io@1.4.8 \
    passport@0.3.2 \
    passport-local@1.0.0 \
    passport.socketio@3.6.2
