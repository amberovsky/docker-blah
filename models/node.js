"use strict";

/**
 * node.js - Node model
 *
 * (C) Anton Zagorskii aka amberovsky amberovsky@gmail.com
 */

class Node {

    /**
     * @constructor
     *
     * @param {number} id - id
     * @param {number} projectId - project id, which this node belongs to
     * @param {string} name - name
     * @param {string} ip - IP in string format
     * @param {number} port - port
     */
    constructor (id, projectId, name, ip, port) {
        /** @type {number} id */
        this.id = id;

        /** @type {number} project id */
        this.projectId = projectId;

        /** @type {string} name */
        this.name = name;

        /** @type {string} ip */
        this.ip = ip;

        /** @type {number} port */
        this.port = port;
    };

    /***
     * @returns {number} id
     */
    getId() {
        return this.id;
    };

    /**
     * Set new id
     *
     * @param {number} id - new id
     *
     * @returns {Node}
     */
    setId(id) {
        this.id = id;

        return this;
    };

    /**
     * @returns {number} project id
     */
    getProjectId() {
        return this.projectId;
    }

    /**
     * @param {number} projectId - project id
     *
     * @returns Node
     */
    setProjectId(projectId) {
        this.projectId = projectId;

        return this;
    }

    /**
     * @returns {string} name
     */
    getName() {
        return this.name;
    };

    /**
     * Set new name
     *
     * @param {string} name - new name
     *
     * @returns {Node}
     */
    setName(name) {
        this.name = name;

        return this;
    };

    /**
     * @returns {string} ip
     */
    getIp() {
        return this.ip;
    };

    /**
     * Set IP
     *
     * @param {string} ip - new ip
     *
     * @returns {Node}
     */
    setIp(ip) {
        this.ip = ip;

        return this;
    };

    /**
     * @returns {number} port
     */
    getPort() {
        return this.port;
    };

    /**
     * Set port
     *
     * @param {number} port - new port
     *
     * @returns {Node}
     */
    setPort(port) {
        this.port = port;

        return this;
    };
    
}

module.exports = Node;
