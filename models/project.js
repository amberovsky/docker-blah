"use strict";

/**
 * project.js - Project model
 *
 * (C) Anton Zagorskii aka amberovsky
 */

class Project {

    /**
     * @constructor
     * 
     * @param {number} id - id
     * @param {string} name - name
     */
    constructor (id, name) {
        /** @type {number} id */
        this.id = id;
        
        /** @type {string} name */
        this.name = name;
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
    
}

module.exports = Project;
