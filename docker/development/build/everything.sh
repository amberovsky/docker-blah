#!/usr/bin/env bash

set -e

/build-development/env.sh
/build-development/ssh.sh
/build-development/redis.sh
/build-development/services.sh
/build-development/cleanup.sh
