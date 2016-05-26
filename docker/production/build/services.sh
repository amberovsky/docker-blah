#!/usr/bin/env bash

set -e

for i in $(ls /build-production/services); do
    mkdir "/etc/service/${i}"
    cp "/build-production/services/${i}" "/etc/service/${i}/run"
done
