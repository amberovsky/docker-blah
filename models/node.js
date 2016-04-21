"use strict";

/**
 * node.js - Node model
 *
 * (C) Anton Zagorskii aka amberovsky
 */

class Node {

    /**
     * @constructor
     *
     * @param {number} id - id
     * @param {number} projectId - project id, which this node belongs to
     * @param {string} name - name
     * @param {string} ip - IP in string format
     */
    constructor (id, projectId, name, ip) {
        /** @type {number} id */
        this.id = id;

        /** @type {number} project id */
        this.projectId = projectId;

        /** @type {string} name */
        this.name = name;

        /** @type {string} ip */
        this.ip = ip;
    };

    /***
     * @returns {number} id
     */
    getId() {
        return this.id;
    };

    /**
     * @returns {number} project id
     */
    getProjectId() {
        return this.projectId;
    }

    /**
     * @returns {string} name
     */
    getName() {
        return this.name;
    };

    /**
     * @returns {string} ip
     */
    getIp() {
        return this.ip;
    };

    /**
     * @returns {number} response time in seconds TODO
     */
    getResponseTime() {
        return 'xxx';
    }
    
}

module.exports = Node;
