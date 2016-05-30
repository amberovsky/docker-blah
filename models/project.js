"use strict";

/**
 * project.js - Project model
 *
 * Copyright (C) 2016 Anton Zagorskii aka amberovsky. All rights reserved. Contacts: <amberovsky@gmail.com>
 */

class Project {

    /**
     * @constructor
     * 
     * @param {number} id - id
     * @param {string} name - name
     * @param {number} userId - user id if it is local docker project for that user, -1 otherwise
     * @param {string} CA - ca.pem file to connect to docker engine
     * @param {string} CERT - cert.pem file to connect to docker engine
     * @param {string} KEY - key.pem file to connect to docker engine
     * @param {number} created - created timestamp
     */
    constructor (id, name, userId, CA, CERT, KEY, created) {
        /** @type {number} id */
        this.id = id;
        
        /** @type {string} name */
        this.name = name;
        
        /** @type {number} user id if it is local docker project for that user, -1 otherwise */
        this.userId = userId;
        
        /** @type {string} ca.pem file to connect to docker engine */
        this.CA = CA;
        
        /** @type {string} cert.pem file to connect to docker engine */
        this.CERT = CERT;
        
        /** @type {string} key.pem file to connect to docker engine */
        this.KEY = KEY;

        /** @type {number} created timestamp */
        this.created = created;
    };

    /**
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
     * @returns {Project}
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
     * @returns {Project}
     */
    setName(name) {
        this.name = name;

        return this;
    };

    /**
     * @returns {number} user id if it is local docker project for that user, -1 otherwise
     */
    getUserId() {
        return this.userId;
    }

    /**
     * @param {number} userId - user id for local docker project
     *
     * @returns {Project}
     */
    setUserId(userId) {
        this.userId = userId;

        return this;
    }
    
    /**
     * @returns {string} ca.pem file to connect to docker engine
     */
    getCA() {
        return this.CA;
    }

    /**
     * @param {string} CA - ca.pem file to connect to docker engine
     * 
     * @returns {Project}
     */
    setCA(CA) {
        this.CA = CA;
        
        return this;
    }

    /**
     * @returns {string} cert.pem file to connect to docker engine
     */
    getCERT() {
        return this.CERT;
    }

    /**
     * @param {string} CERT - cert.pem file to connect to docker engine 
     * 
     * @returns {Project}
     */
    setCERT(CERT) {
        this.CERT = CERT;
        
        return this;
    }
    
    /**
     * @returns {string} key.pem file to connect to docker engine
     */
    getKEY() {
        return this.KEY;
    }

    /**
     * @param {string} KEY - key.pem file to connect to docker engine 
     * 
     * @returns {Project}
     */
    setKEY(KEY) {
        this.KEY = KEY;
        
        return this;
    }

    /**
     * @returns {number} created timestamp
     */
    getCreated() {
        return this.created;
    }

    /**
     * @param {number} created - created timestamp
     *
     * @returns {Project}
     */
    setCreated(created) {
        this.created = created;

        return this;
    }
    
}

module.exports = Project;
