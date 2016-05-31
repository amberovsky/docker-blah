#!/usr/bin/env bash

#
# Build production from given tag
#

set -e

#
# display usage help
#
usage() {
cat <<EOF
Build production image
Tag in gihub is needed

Usage: $0 <TAG>

EOF
}

if [[ ("$#" -ne 1) ]]; then
    printf "Wrong number of arguments!\n\n"
    usage
    exit 1
fi

TAG=$1

docker  build --no-cache -t amberovsky/docker-blah-production:${TAG} \
        --build-arg TAG=${TAG} \
        ./production

docker tag amberovsky/docker-blah-production:${TAG} amberovsky/docker-blah-production:latest
