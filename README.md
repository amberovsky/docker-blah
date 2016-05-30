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
   * [Configure docker daemon](#configure_docker_daemon)
 * [Usage](#usage)   
 * [Who uses docker-blah](#who_uses_docker_blah)
 * [License](#license)
 
<a name="about"></a>
## About

Qwe

<a name="tech_specs"></a>
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

This topic is described in details in the [official docker docs](https://docs.docker.com/engine/security/https/)

The idea is to control all nodes in each project by one set of certificates, per project. So it will be easy to add/remove nodes from a project.

#### Client/CA certificates 

-   CA private key: 
    ```bash
    openssl genrsa -aes256 -out ca-key.pem 4096
    ```
    
-   CA public key (You can use either IP or DNS in "Common Name"):
    ```bash
    openssl req -new -x509 -days 365 -key ca-key.pem -sha256 -out ca.pem
    ```

-   Client key:
    ```bash
    openssl genrsa -out key.pem 4096
    ```
    
-   Certificate signing request:
    ```bash
    openssl req -subj '/CN=client' -new -key key.pem -out client.csr
    ```
    
-   Extensions config file:
    ```bash
    echo extendedKeyUsage = clientAuth > extfile.cnf
    ```
    
-   Sign the public key:
    ```bash
    openssl x509 -req -days 365 -sha256 -in client.csr -CA ca.pem -CAkey ca-key.pem \
        -CAcreateserial -out cert.pem -extfile extfile.cnf
    ```
       
-   Remove certificate signing request:
    ```bash
    rm -v client.csr
    ```

-   Restrict access for keys:
    ```bash
    chmod -v 0400 ca-key.pem key.pem
    ```
    
-   Restrict access for certificates:
    ```bash
     chmod -v 0444 ca.pem cert.pem
    ```
    
You will need `cert.pem`, `ca.pem` and `key.pem` in a project configuration in the `docker-blah`. Also, these files are required to generate server certificates.
     
#### Server certificate (per each node / IP)
     
-   Private key:
    ```bash
    openssl genrsa -out server-key.pem 4096
    ```
    
-   Certificate signing request (remember, `$HOST` is the node's IP or DNS name):
    ```bash
    openssl req -subj "/CN=$HOST" -sha256 -new -key server-key.pem -out server.csr
    ```

-   Allow connection using IP/DNS:
    ```bash
    echo subjectAltName = $HOST > extfile.cnf
    ```

-   Signing the public key:
    ```bash
    openssl x509 -req -days 365 -sha256 -in server.csr -CA ca.pem -CAkey ca-key.pem \
      -CAcreateserial -out server-cert.pem -extfile extfile.cnf
    ```
    
-   Remove certificate signing request:
    ```bash
    rm -v server.csr
    ```
    
-   Restrict access for key:
    ```bash
    chmod -v 0400 server-key.pem
    ```
    
-   Restrict access for certificate:
    ```bash
     chmod -v 0444 server-cert.pem
    ```

<a name="configure_docker_daemon"></a>
### Configure docker daemon:

Now we need to tell docker daemon to listen on a particular port using TLS.



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
