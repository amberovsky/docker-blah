#!/usr/bin/env bash

set -e

apt-get install -y nginx

rm -rf /etc/nginx/conf.d/* /etc/nginx/sites-available /etc/nginx/sites-enabled
mv /build-base/conf/nginx.conf /etc/nginx/nginx.conf
