"use strict";

/**
 * projectManager.js - Manager for Project. Responsible for saving, retrieving, search. Also knows about roles in
 * all projects
 *
 * (C) Anton Zagorskii aka amberovsky amberovsky@gmail.com
 */

/** @type {Project} */
var Project = require('./project.js');

class ProjectManager {
    /**
     * Callback to be used for all operations with Project
     *
     * @callback ProjectOperationCallback
     *
     * @param {(null|string)} error - error message 
     * @param {(null|boolean|Project|Object.<number, Project>)} project - project (or list of projects) after applied
     *        operation or null if no project with given criteria or boolean for check/if/does operations
     */

    /**
     * @constructor
     *
     * @param {Application} application - application
     * @param {UserManager} userManager - userManager
     * @param {winston.Logger} logger - logger
     */
    constructor(application, userManager, logger) {
        /** @property {number} ROLE_ADMIN - @constant for ADMIN role */
        application.createConstant(this, 'ROLE_ADMIN', 1);

        /** @property {number} ROLE_USER - @constant for USER role */
        application.createConstant(this, 'ROLE_USER', 2);


        /** @property {number} MIN_TEXT_FIELD_LENGTH - @constant minimum length for Project text properties */
        application.createConstant(this, 'MIN_TEXT_FIELD_LENGTH', 5);

        this.userManager = userManager;
        this.sqlite3 = application.getSqlite3();
        this.logger = logger;
    };

    /**
     * @returns {Project} new blank project
     */
    create() {
        return new Project(-1, '', -1, '', '', '', 0);
    };

    /**
     * Creates a new project from given values from database
     *
     * @param {sqlite3.row} row - row from database
     *
     * @returns {Project} new project
     */
    createFromRow(row) {
        return new Project(row.id, row.name, row.user_id, row.ca, row.cert, row.key, row.created);
    }

    /**
     * @param {number} role - role
     *
     * @returns {string} - string role representation
     */
    getRoleCaption(role) {
        switch(role) {
            case this.ROLE_ADMIN:
                return 'ADMIN';
                break;

            case this.ROLE_USER:
                return 'USER';
                break;

            default:
                return 'WRONG!1';
                break;
        }
    };

    /**
     * @returns {Object.<string, number>} string role representation as a key and integer role value as a value
     */
    getRoles() {
        return {
            'ADMIN': this.ROLE_ADMIN,
            'USER': this.ROLE_USER
        }
    };

    /**
     * @param {number} role - value to explore
     *
     * @returns {boolean} if given value is a valid role
     */
    isRoleValid(role) {
        return (role == this.ROLE_ADMIN) || (role == this.ROLE_USER);
    };

    /**
     * @param {number} id - project's id
     * @param {ProjectOperationCallback} callback - project operation callback 
     */
    getById(id, callback) {
        var self = this;

        this.sqlite3.get(
            'SELECT id, name, user_id, ca, cert, key, created FROM project WHERE (id = ?)',
            [
                id
            ],
            function (error, row) {
                if (typeof row === 'undefined') {
                    callback(null, null);
                } else if (error === null) {
                    callback(null, self.createFromRow(row));
                }  else {
                    self.logger.error(error);
                    callback(error, null);
                }
            }
        );
    };

    /**
     * Fetch all projects except local dockers
     *
     * @param {ProjectOperationCallback} callback - project operation callback
     */
    getAllExceptLocal(callback) {
        var
            projects = {},
            self = this;

        this.sqlite3.each(
            'SELECT id, name, user_id, ca, cert, key, created FROM project WHERE (user_id = -1)',
            function (error, row) {
                if (error === null) {
                    var project = self.createFromRow(row);
                    projects[project.getId()] = project;
                } else {
                    self.logger.error(error);
                    callback(error, {});
                }
            }, function (error) {
                if (error !== null) {
                    self.logger.error(error);
                }

                callback(error, projects);
            }
        );
    };

    /**
     * @param {string} name - project's name
     * @param {number} currentProjectId - which project to skip
     * @param {ProjectOperationCallback} callback - project operation callback
     */
    doesExistWithSameName(name, currentProjectId, callback) {
        var self = this;
        
        this.sqlite3.get(
            'SELECT id FROM project WHERE (id <> ?) AND (name = ?)',
            [
                currentProjectId,
                name
            ],
            function (error, row) {
                if (typeof row === 'undefined') {
                    callback(null, false);
                } else if (error === null) {
                    callback(null, true);
                }  else {
                    self.logger.error(error);
                    callback(error, true);
                }
            }
        );
    };
    
    /**
     * Add a new project
     *
     * @param {Project} project - new project
     * @param {DatabaseOperationCallback} callback - database operation callback
     */
    add(project, callback) {
        var self = this;
        
        this.sqlite3.run(
            'INSERT INTO project (name, user_id, ca, cert, key, created) VALUES (?, ?, ?, ?, ?, ?)',
            [
                project.getName(),
                project.getUserId(),
                project.getCA(),
                project.getCERT(),
                project.getKEY(),
                project.getCreated()
            ], function (error) {
                if (error === null) {
                    project.setId(this.lastID);
                    callback(null);
                } else {
                    self.logger.error(error);
                    callback(error);
                }
            }
        );
    };

    /**
     * Update project data
     *
     * @param {Project} project - project with new values
     * @param {DatabaseOperationCallback} callback - database operation callback
     */
    update(project, callback) {
        var self = this;
        
        this.sqlite3.run(
            'UPDATE project SET name = ?, user_id = ?, ca = ?, cert = ?, key = ?, created = ? WHERE id = ?',
            [
                project.getName(),
                project.getUserId(),
                project.getCA(),
                project.getCERT(),
                project.getKEY(),
                project.getCreated(),
                project.getId()
            ], function (error) {
                if (error === null) {
                    if (this.changes === 0) {
                        self.logger.error('No rows were updated');
                        callback('No rows were updated')
                    } else {
                        callback(null);
                    }
                } else {
                    self.logger.error(error);
                    callback(error);
                }
            }
        );
    };

    /**
     * Delete given user from all projects
     *
     * @param {number} userId - user id
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    deleteUserFromAllProjects(userId, callback) {
        var self = this;
        
        this.sqlite3.run(
            'DELETE FROM project_user WHERE user_id = ?',
            [
                userId
            ],
            function (error) {
                if (error === null) {
                    if (this.changes === 0) {
                        self.logger.error('No rows were deleted');
                        callback('No rows were deleted');
                    } else {
                        callback(null);
                    }
                } else {
                    self.logger.error(error);
                    callback(error);
                }
            }
        )
    };
    
    /**
     * Set given roles for given user
     *
     * @param {number} userId - user id
     * @param {Object.<number, number>} roles - list of roles, where keys are projects ids and values - roles
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    setUserRoleInProject(userId, roles, callback) {
        var self = this;
        
        if (Object.keys(roles).length == 0) {
            return callback(null);
        }

        var
            addComma = false,
            query = 'INSERT OR REPLACE INTO project_user (project_id, user_id, role) VALUES ';

        for (var projectId in roles) {
            if (addComma) {
                query += ', ';
            } else {
                addComma = true;
            }

            query += '(' + projectId + ', ' + userId + ', ' + roles[projectId] + ')';
        }

        this.sqlite3.run(query, [], function (error) {
            if (error === null) {
                return callback(null);
            } else {
                self.logger.error(error);
                return callback(error);
            }
        });
    };
    
    /**
     * Get list of all projects with roles which given user has
     *
     * @param {User} user - user
     * @param {callback} callback - {Object.<number, Object.<Project, number>>} project_id x { project, role }
     */
    getAllForUser(user, callback) {
        var
            projects = {},
            self = this;

        this.sqlite3.each(
            'SELECT' +
            '   role, project.id, project.name, project.user_id, project.ca, project.cert, project.key, project.created ' +
            'FROM ' +
            '   project_user LEFT JOIN project ' +
            'ON ' +
            '   (project_user.project_id = project.id) ' +
            'WHERE ' +
            '   (project_user.user_id = ?)',
            [
                user.getId()
            ],
            function (error, row) {
                if (error === null) {
                    var project = self.createFromRow(row);

                    projects[project.getId()] = {
                        project: project,
                        role: row.role
                    };
                } else {
                    self.logger.error(error);
                    callback(error, {});
                }
            }, function (error) {
                if (error !== null) {
                    self.logger.error(error);
                }

                callback(error, projects);
            }
        );
    };

    /**
     * Delete project
     *
     * @param {number} projectId - project id
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    deleteProject(projectId, callback) {
        var self = this;
        
        this.sqlite3.run('DELETE FROM project_user WHERE project_id = ?', [projectId], function (error) {
            if (error === null) {
                self.sqlite3.run('DELETE FROM project WHERE id = ?', [projectId], function (error) {
                   if (error === null) {
                       callback(null);
                   } else {
                       self.logger.error(error);
                       callback(error);
                   }
                });
            } else {
                self.logger.error(error);

                callback(error);
            }
        });
    };

    /**
     * @param {number} userId - user id
     * @param {callback} callback - {Object.<number, number>} project_id x role
     */
    getUserRoleInProjects(userId, callback) {
        var
            roles = {},
            self = this;

        this.sqlite3.each(
            'SELECT role, project_id FROM project_user WHERE (user_id = ?)',
            [
                userId
            ],
            function(error, row) {
                if (error === null) {
                    roles[row.project_id] = row.role;
                } else {
                    self.logger.error(error);
                    callback(error, {});
                }
            }, function (error) {
                if (error !== null) {
                    self.logger.error(error);
                }

                callback(error, roles);
            }
        );
    };
    
}

module.exports = ProjectManager;
