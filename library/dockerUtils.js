"use strict";

/**
 * dockerUtils.js - Common parts for dockerode
 *
 * (C) Anton Zagorskii aka amberovsky
 */

class DockerUtils {

    /**
     * @constructor
     *
     * @param {Object} request - expressjs request
     */
    constructor(request) {
        this.request = request;
        this.docker = null;
    };

    /**
     * @returns {Object} Docker object for current request
     */
    getDocker() {
        if (this.docker === null) {
            var Docker = require('dockerode');

            this.docker = new Docker({
                host: this.request.node.getIp(),
                protocol: 'https',
                ca: this.request.project.getCA(),
                cert: this.request.project.getCERT(),
                key: this.request.project.getKEY(),
                port: this.request.node.getPort()
            });
        }

        return this.docker;
    }
}

module.exports = DockerUtils;
