"use strict";

/**
 * registry.js - Registry model
 *
 * (C) Anton Zagorskii aka amberovsky amberovsky@gmail.com
 */

class Registry {

    /**
     * @constructor
     *
     * @param {number} id - id
     * @param {string} name - name
     * @param {string} ip - IP in string format
     */
    constructor (id, name, ip) {
        /** @type {number} id */
        this.id = id;

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
    
}

module.exports = Registry;
