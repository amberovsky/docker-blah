# docker-blah

Docker - be less as hossible

**Table of contents**

 * [About](#about)
   * [Tech specs](#tech_specs)
   * [Docker structure](#docker_structure)
 * [How to run](#how_to_run)
   * [Development](#how_to_run_development)
   * [Production](#how_to_run_production)
   * [Create certificates](#create_certificates)
 * [Usage](#usage)   
 * [Who uses docker-blah](#who_uses_docker_blah)
 * [License](#license)
 
<a name="about"></a>
## About

Qwe

<a name="tech_spec"></a>
### Tech specs

| What       | Why / How ? |
| ---------- | ---- |
| [the Docker](https://www.docker.com/) | ! |
| [phusion/baseimage:0.9.18](https://github.com/phusion/baseimage-docker/tree/rel-0.9.18) | perfect image |
| [runit](http://smarden.org/runit/) | as a part of the baseimage, to keep the node up and running |
| [nginx](https://www.nginx.com/) | serve for the static content |
| [nodejs 6.x](https://nodejs.org/en/) | all packages are installed in the docker-blah base image |
| [express 4](http://expressjs.com/) | perfect framework |
| [dockerode](https://github.com/apocas/dockerode) | talk to docker daemon |
| [sqlite3](https://github.com/mapbox/node-sqlite3) | database |
| [nunjucks 2](https://mozilla.github.io/nunjucks/) | template engine |
| [connect-redis](https://www.npmjs.com/package/connect-redis) | session backend |
| [winston](https://github.com/winstonjs/winston) | logger |
| [multer](https://github.com/expressjs/multer) | file uploader |
| [socket.io 1.x](http://socket.io/) | websockets |
| [passport.socketio](https://github.com/jfromaniello/passport.socketio) | websocket auth |
| [and more...](./docker/base/build/node.sh) | |

<a name="docker_structure"></a>
### Docker structure

<a name="how_to_run"></a>
## How to run

<a name="how_to_run_development"></a>
### Development

<a name="how_to_run_production"></a>
### Production

<a name="create_certificates"></a>
### Create certificates

<a name="usage"></a>
## Usage

<a name="who_uses_docker_blah"></a>
## Who uses docker-blah

 * [Collinson Group](http://collinsongroup.com/)
 
Please let me know if you are using `docker-blah`!
 
<a name="license"></a>
## License

`docker-blah` is [Apache 2.0 licensed](./LICENSE)

Copyright (C) 2016 Anton Zagorskii aka amberovsky.
All rights reserved. Contacts: <amberovsky@gmail.com> 
