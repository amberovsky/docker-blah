#!/usr/bin/env bash

set -e

# do not install recommendations
echo "APT::Install-Recommends false;" >> /etc/apt/apt.conf.d/recommends.conf
echo "APT::AutoRemove::RecommendsImportant false;" >> /etc/apt/apt.conf.d/recommends.conf
echo "APT::AutoRemove::SuggestsImportant false;" >> /etc/apt/apt.conf.d/recommends.conf

apt-get update && apt-get -y upgrade

chsh -s /bin/bash www-data

echo en_US.UTF-8 UTF-8 >> /var/lib/locales/supported.d/local
dpkg-reconfigure locales

cp /usr/share/zoneinfo/Europe/London /etc/localtime
echo Europe/London > /etc/timezone

update-locale LANG=en_US.UTF-8

mkdir -p /var/www/docker-blah/master /var/log/docker-blah
chown www-data:www-data -R /var/www /var/log/docker-blah

cp /build-base/conf/www.profile /var/www/.profile

echo "www-data ALL=(ALL:ALL) NOPASSWD: ALL" >> /etc/sudoers
