FROM phusion/baseimage:0.9.18

MAINTAINER Anton Zagorskii <amberovsky@gmail.com>

ENV DEBIAN_FRONTEND noninteractive

ADD ./build /build-base

RUN /build-base/everything.sh && rm -rf /build-base
