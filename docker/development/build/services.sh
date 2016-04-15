#!/usr/bin/env bash

set -e

for i in $(ls /build-development/services); do
    mkdir "/etc/service/${i}"
    cp "/build-development/services/${i}" "/etc/service/${i}/run"
done
