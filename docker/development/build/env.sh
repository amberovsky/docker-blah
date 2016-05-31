#!/usr/bin/env bash

set -e

apt-get update
apt-get install -y mc man

echo "www-data ALL=(ALL:ALL) NOPASSWD: ALL" >> /etc/sudoers
