FROM pumpkin-development/docker-blah/base:0.0.1

MAINTAINER Anton Zagorskii <amberovsky@gmail.com>

ENV DEBIAN_FRONTEND noninteractive

ADD ./build /build-development

RUN /build-development/everything.sh && rm -rf /build-development
