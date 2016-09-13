#!/usr/bin/env bash

set -e

docker build -t amberovsky/docker-blah-development:0.2 ./development
docker tag amberovsky/docker-blah-development:0.2 amberovsky/docker-blah-development:latest
