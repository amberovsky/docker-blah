# `docker-blah` development image

[Go back to docker structure documentation](../README.md)

## Build

-   `../bin/build_development.sh` will build and tag (version + latest) your image

-   Don't forget to change tag!

## What is inside
-   [docker-blah-base](../base/README.md)

-   `ssh`: www-data & root passwordless

-   `redis` server

-   `runit` service for redis

-   `sqlite3` client library

## Usage

See [main documentation](/README.md#how_to_run_development)

## History

-   `0.0.1`:

    Initial release

## License

`docker-blah` is [Apache 2.0 licensed](/LICENSE)

Copyright (C) 2016 Anton Zagorskii aka amberovsky.
All rights reserved. Contacts: <amberovsky@gmail.com> 
