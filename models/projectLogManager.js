"use strict";

/**
 * projectLogManager.js - Manager for project logs
 *
 * (C) Anton Zagorskii aka amberovsky amberovsky@gmail.com
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
     * @param {(null|boolean|ProjectLog|Object.<number, ProjectLog>)} projectLog - projet log (or list of project logs)
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
     * Creates a new project log from given values from database
     *
     * @param {sqlite3.row} row - row from database
     *
     * @returns {ProjectLog} new project log
     */
    createFromRow(row) {
        return new ProjectLog(row.id, row.project_id, row.name, row.path);
    }

    /**
     * Get list of all project logs in the given project
     *
     * @param {number} projectId - project id
     * @param {ProjectLogOperationCallback} callback - project log operation callback
     */
    getAllForProject(projectId, callback) {
        var
            projectLogs = {},
            self = this;

        this.sqlite3.each(
            'SELECT id, project_id, name, path FROM project_log WHERE (project_id = ?)',
            [projectId],
            function (error, row) {
                if (error === null) {
                    var projectLog = self.createFromRow(row);
                    projectLogs[projectLog.getId()] = projectLog;
                } else {
                    this.logger.error(error);
                    callback(error, {});
                }
            }, function (error) {
                if (error !== null) {
                    self.logger.error(error);
                }

                callback(error, projectLogs);
            }
        );
    }

}

module.exports = ProjectLogManager;
