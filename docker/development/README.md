# docker-blah development image

## Inside
-   docker-blah-development
-   ssh: www-data & root passwordless
-   redis server
-   nginx

## Build (optional)
-   `./bin/build-development` (base image is required)

## Usage
-   `docker run -d -it -v /path-to-sources/:/var/www/docker-blah/master -p 81:80 -p 2222:22 --name=docker-blah-development amberovsky/docker-blah-development`
-   `./docker-blah/master/bin/run.sh`

## History
-   0.0.1

    Initial release

## Questions?
Anton Zagorskii aka amberovsky (amberovsky@gmail.com)
