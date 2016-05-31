FROM amberovsky/docker-blah-base:0.0.1

MAINTAINER Anton Zagorskii <amberovsky@gmail.com>

ENV DEBIAN_FRONTEND noninteractive

ARG TAG

ADD ./build /build-production

RUN /build-production/everything.sh && rm -rf /build-production
