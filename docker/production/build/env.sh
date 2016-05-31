#!/usr/bin/env bash

set -e

apt-get update
apt-get install -y git

git clone --branch ${TAG} --depth=1 https://github.com/amberovsky/docker-blah.git /var/www/docker-blah/master
rm -rf /var/www/docker-blah/master/.git

chown -R www-data:www-data /var/www/docker-blah/master

apt-get remove -y git
