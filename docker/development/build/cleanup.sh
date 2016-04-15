#!/usr/bin/env bash

set -e

apt-get autoremove -y

rm -rf /var/lib/log/*
rm -rf /tmp/* /var/tmp/*
