"use strict";

/**
 * registryManager.js - Manager for Registry. Responsible for saving, retrieving, search.
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/** @type {Registry} */
var Registry = require('./registry.js');

class RegistryManager {

    /**
     * Callback to be used for all operations with Registry
     *
     * @callback RegistryOperationCallback
     *
     * @param {(null|string)} error - error message
     * @param {(null|boolean|Registry|Object.<number, Registry>)} registry - registry (or list of registries) after
     *        applied operation or null if no registry with given criteria or boolean for check/if/does operations
     */


    /**
     * @constructor
     *
     * @param {Application} application - application
     * @param {winston.Logger} logger - logger
     */
    constructor(application, logger) {
        /** @property {number} MIN_TEXT_FIELD_LENGTH - @constant minimum length for Registry text properties */
        application.createConstant(this, 'MIN_TEXT_FIELD_LENGTH', 5);

        this.sqlite3 = application.getSqlite3();
        this.logger = logger;
    };

    /**
     * @returns {Registry} new blank registry
     */
    create() {
        return new Registry(-1, '', '');
    };

    /**
     * Fetch all registries
     *
     * @param {RegistryOperationCallback} callback - registry operation callback
     */
    getAll(callback) {
        var
            registries = {},
            self = this;

        callback(null, {});
    };

}

module.exports = RegistryManager;
