#!/usr/bin/env bash

set -e

/build-base/env.sh
/build-base/node.sh
/build-base/nginx.sh
/build-base/services.sh
/build-base/cleanup.sh
