#!/usr/bin/env bash

set -e

apt-get clean
apt-get autoremove -y

rm -rf /var/lib/apt/* /var/lib/cache/* /var/lib/log/*
rm -rf /tmp/* /var/tmp/*
