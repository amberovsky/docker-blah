"use strict";

/**
 * projectLog.js - Project log
 *
 * (C) Anton Zagorskii aka amberovsky amberovsky@gmail.com
 */

class ProjectLog {

    /**
     * @constructor
     * 
     * @param {number} id - id
     * @param {number} projectId - project id 
     * @param {string} name - name
     * @param {string} path - system path to a log
     */
    constructor (id, projectId, name, path) {
        /** @type {number} id */
        this.id = id;

        /** @type {number} project id */
        this.projectId = projectId;

        /** @type {string} name */
        this.name = name;

        /** @type {string} system path to a log */
        this.path = path;
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
     * Set new project id
     * 
     * @param {number} projectId - new project id
     * 
     * @returns {ProjectLog}
     */
    setProjectId(projectId) {
        this.projectId = projectId;
        
        return this;
    };

    /**
     * @returns {number} project id
     */
    getProjectId() {
        return this.projectId;
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
     * @returns {ProjectLog}
     */
    setName(name) {
        this.name = name;

        return this;
    };

    /**
     * @returns {string} system path to a log
     */
    getPath() {
        return this.path;
    };

    /**
     * Set new system path to a log
     *
     * @param {string} path - new system path to a log
     *
     * @returns {ProjectLog}
     */
    setPath(path) {
        this.path = path;

        return this;
    };
    
}

module.exports = ProjectLog;
