FROM amberovsky/docker-blah-base:0.2

MAINTAINER Anton Zagorskii <amberovsky@gmail.com>

ARG TAG

ADD ./build /build-production

RUN /build-production/everything.sh && rm -rf /build-production
