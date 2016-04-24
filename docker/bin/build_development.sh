#!/usr/bin/env bash

set -e

docker build -t amberovsky/docker-blah-development:0.0.1 ./development
docker tag amberovsky/docker-blah-development:0.0.1 amberovsky/docker-blah-development:latest
