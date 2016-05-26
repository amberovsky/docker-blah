#!/usr/bin/env bash

set -e

/build-production/env.sh
/build-production/services.sh
/build-production/cleanup.sh
