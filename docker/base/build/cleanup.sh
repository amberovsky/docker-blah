#!/usr/bin/env bash

set -e

apt-get autoremove -y
apt-get clean

rm -rf /var/lib/apt/* /var/lib/cache/* /var/lib/log/*
rm -rf /tmp/* /var/tmp/*
