#!/usr/bin/env bash

set -e

apt-get update
apt-get install -y git

git clone --branch ${TAG} --depth=1 https://github.com/amberovsky/docker-blah.git /var/www/admin/master
chown -R www-data:www-data /var/www/admin/master

apt-get remove -y git
