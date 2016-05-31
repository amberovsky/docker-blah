#!/usr/bin/env bash

set -e

apt-get install -y redis-server
mv /build-development/conf/redis.conf /etc/redis/redis.conf
