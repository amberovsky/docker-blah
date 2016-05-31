#!/usr/bin/env bash

set -e

for i in $(ls /build-base/services); do
    mkdir "/etc/service/${i}"
    cp "/build-base/services/${i}" "/etc/service/${i}/run"
done
