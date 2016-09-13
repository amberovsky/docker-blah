#!/usr/bin/env bash

set -e

apt-get update

mkdir -p /var/www/docker-blah/master /var/www/docker-blah/data /var/log/docker-blah
chown www-data:www-data -R /var/www /var/log/docker-blah

cp /build-base/conf/www.profile /var/www/.profile
