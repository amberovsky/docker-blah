FROM amberovsky/layerzero:0.2

MAINTAINER Anton Zagorskii <amberovsky@gmail.com>

ADD ./build /build-base

RUN /build-base/everything.sh && rm -rf /build-base
