# `docker-blah` base image

[Go back to docker structure documentation](../README.md)

Base image will provide a base layer both for development and production images.

## Build

-   `../bin/build_base.sh` will build and tag (version + latest) your image

-   Don't forget to change tag!

## What is inside

-   [phusion/baseimage:0.9.18](https://github.com/phusion/baseimage-docker/tree/rel-0.9.18)

-   `Etc/UTC` timezone

-   `nodejs` 6.x

-   `nginx`

-   `runit` services for `docker-blah` and `nginx`

## History

-   `0.0.1`:

    Initial release

## License

`docker-blah` is [Apache 2.0 licensed](/LICENSE)

Copyright (C) 2016 Anton Zagorskii aka amberovsky.
All rights reserved. Contacts: <amberovsky@gmail.com> 