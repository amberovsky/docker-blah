"use strict";

/**
 * dockerUtils.js - Common parts for dockerode
 *
 * Copyright (C) 2016 Anton Zagorskii aka amberovsky. All rights reserved. Contacts: <amberovsky@gmail.com>
 */

class DockerUtils {

    /**
     * @constructor
     */
    constructor() {
        this.Docker = require('dockerode');
    };

    /**
     * @param {Object} request - expressjs request
     * @returns {Function} - docker instance for a request
     */
    createDockerForRequest(request) {
        var self = this;

        return function() {
            if (typeof request.docker === 'undefined') {
                request.docker = new self.Docker({
                    host: request.node.getIp(),
                    protocol: 'https',
                    ca: request.project.getCA(),
                    cert: request.project.getCERT(),
                    key: request.project.getKEY(),
                    port: request.node.getPort()
                });
            }

            return request.docker;
        }
    }

    /**
     * Create docker object by custom parameters
     *
     * @param {string} ip - node IP
     * @param {number} port - node port
     * @param {string} CA - CA
     * @param {string} CERT - CERT
     * @param {string} KEY - KEY
     */
    createDockerCustom(ip, port, CA, CERT, KEY) {
        return new this.Docker({
            host: ip,
            protocol: 'https',
            ca: CA,
            cert: CERT,
            key: KEY,
            port: port
        });
    }
    
}

module.exports = DockerUtils;
