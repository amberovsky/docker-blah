#!/usr/bin/env bash

set -e

docker build -t amberovsky/docker-blah-base:0.2 ./base
docker tag amberovsky/docker-blah-base:0.2 amberovsky/docker-blah-base:latest
