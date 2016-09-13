FROM amberovsky/docker-blah-base:0.2

MAINTAINER Anton Zagorskii <amberovsky@gmail.com>

ADD ./build /build-development

RUN /build-development/everything.sh && rm -rf /build-development
