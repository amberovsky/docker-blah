"use strict";

/**
 * projectLogManager.js - Manager for project logs
 *
 * Copyright (C) 2016 Anton Zagorskii aka amberovsky. All rights reserved. Contacts: <amberovsky@gmail.com>
 */

/** @type {ProjectLog} */
var ProjectLog = require('./projectLog.js');

class ProjectLogManager {

    /**
     * Callback to be used for all operations with Project Log
     *
     * @callback ProjectLogOperationCallback
     *
     * @param {(null|string)} error - error message
     * @param {(null|boolean|ProjectLog|Object.<number, ProjectLog>)} projectLog - project log (or list of project logs)
     *        after applied operation or null if no project log with given criteria or boolean for check/if/does
     *        operations
     */


    /**
     * @constructor
     *
     * @param {Application} application - application
     * @param {winston.Logger} logger - logger
     */
    constructor(application, logger) {
        /** @property {number} MIN_TEXT_FIELD_LENGTH - @constant minimum length for project log text properties */
        application.createConstant(this, 'MIN_TEXT_FIELD_LENGTH', 5);

        this.sqlite3 = application.getSqlite3();
        this.logger = logger;
    };

    /**
     * @param {number} projectId - project id
     *
     * @returns {ProjectLog} - new projectLog for given project
     */
    create(projectId) {
        return new ProjectLog(projectId, '');
    }

    /**
     * Creates a new project log from given values from database
     *
     * @param {sqlite3.row} row - row from database
     *
     * @returns {ProjectLog} new project log
     */
    createFromRow(row) {
        return new ProjectLog(row.project_id, row.logs);
    }

    /**
     * Get project logs in the given project
     *
     * @param {number} projectId - project id
     * @param {ProjectLogOperationCallback} callback - project log operation callback
     */
    getByProjectId(projectId, callback) {
        var
            projectLogs = {},
            self = this;

        this.sqlite3.get(
            'SELECT project_id, logs FROM project_log WHERE (project_id = ?)',
            [projectId],
            function (error, row) {
                if (typeof row === 'undefined') {
                    return callback(null, null);
                }

                if (error === null) {
                    callback(null, self.createFromRow(row));
                } else {
                    this.logger.error(error);
                    callback(error, null);
                }
            }
        );
    }

    /**
     * Create or update project log
     *
     * @param {ProjectLog} projectLog - projectLog
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    update(projectLog, callback) {
        this.sqlite3.run(
            'INSERT OR REPLACE INTO project_log (project_id, logs) VALUES (?, ?)',
            [
                projectLog.getProjectId(),
                projectLog.getLogs()
            ],
            function (error) {
                if (error === null) {
                    return callback(null);
                } else {
                    self.logger.error(error);
                    return callback(error);
                }
            }
        );
    }

    /**
     * Delete project log in the given project
     *
     * @param {number} projectId - project id
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    deleteByProjectId(projectId, callback) {
        var self = this;

        this.sqlite3.run('DELETE FROM project_log WHERE project_id = ?', [projectId], function (error) {
            if (error === null) {
                callback(null);
            } else {
                self.logger.error(error);
                callback(error);
            }
        });
    };

}

module.exports = ProjectLogManager;
