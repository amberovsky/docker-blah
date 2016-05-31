#!/usr/bin/env bash

set -e

docker build -t amberovsky/docker-blah-base:0.0.1 ./base
docker tag amberovsky/docker-blah-base:0.0.1 amberovsky/docker-blah-base:latest
