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
     * @param {number} projectId - project id 
     * @param {string} logs - unparsed list of logs
     */
    constructor (projectId, logs) {
        /** @type {number} project id */
        this.projectId = projectId;

        /** @type {string} unparsed list of logs */
        this.logs = '';

        /** @type {string[]} parsed list of logs */
        this.parsedLogs = [];

        this.setLogs(logs);
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
     * @returns {string} unparsed list of logs
     */
    getLogs() {
        return this.logs;
    };

    /**
     * @returns {string[]} parsed list of logs
     */
    getParsedLogs() {
        return this.parsedLogs;
    }

    /**
     * @param {string} logs - new unparsed list of logs
     * 
     * @returns {ProjectLog}
     */
    setLogs(logs) {
        this.parsedLogs = logs
            .split(/\r?\n/)
            .map((value) => { return value.trim(); })
            .filter((value) => { return value.length > 0; });

        this.logs = this.parsedLogs.join('\n');

        return this;
    };
    
}

module.exports = ProjectLog;
