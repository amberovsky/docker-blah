"use strict";

/**
 * dockerBlah.js - the project itself
 *
 * (C) Anton Zagorskii aka amberovsky
 */

class DockerBlah {

    /**
     * Callback to be used for all database operations
     *
     * @callback DatabaseOperationCallback
     *
     * @param {null|Boolean} isError - indicates was there an error during database operation (true) or null otherwise
     */

    /**
     * @constructor
     * 
     * @param {Application} application - application
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    constructor(application, callback) {
        var self = this;

        /** @type {Auth} - Auth */
        this.auth = new (require('./auth.js'))(application);

        /** @type {ProjectManager} - project manager */
        this.projectManager = new (require('../models/projectManager.js'))(application, function(error) {
            if (error === null) {
                /** @type {NodeManager} - node manager */
                self.nodeManager = new (require('../models/nodeManager.js'))(application, function(error) {
                    if (error === null) {
                        /** @type {UserManager} - user manager */
                        self.userManager = new (require('../models/userManager.js'))(application, function(error) {
                            if (error === null) {
                                callback(null);
                            } else {
                                console.log(error);
                            }
                        });
                    } else {
                        console.log(error);
                    }
                });
            } else {
                console.log(error);
            }
        });
    };

    /**
     * @returns {Auth}
     */
    getAuth() {
        return this.auth;
    }

    /**
     * @returns {ProjectManager}
     */
    getProjectManager() {
        return this.projectManager;
    }

    /**
     * @returns {NodeManager}
     */
    getNodeManager() {
        return this.nodeManager;
    }

    /**
     * @returns {UserManager}
     */
    getUserManager() {
        return this.userManager;
    }
    
}

module.exports = DockerBlah;
