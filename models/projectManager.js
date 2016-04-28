"use strict";

/**
 * projectManager.js - Manager for Project. Responsible for saving, retrieving, search. Also knows about roles in
 * all projects
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/** @type {Project} */
var Project = require('./project.js');

class ProjectManager {
    /**
     * Callback to be used for all database operations
     *
     * @callback ProjectOperationCallback
     *
     * @param {(null|Project|Object.<number, Project>)} project - project (or list of projects) after applied operation
     *                                                            or null if no projet with given criteria
     * @param {(null|string)} error - error message
     */

    /**
     * @constructor
     *
     * @param {Application} application - application
     */
    constructor(application) {
        /** @property {number} ROLE_ADMIN - @constant for ADMIN role */
        application.createConstant(this, 'ROLE_ADMIN', 1);

        /** @property {number} ROLE_USER - @constant for USER role */
        application.createConstant(this, 'ROLE_USER', 2);


        /** @property {number} MIN_TEXT_FIELD_LENGTH - @constant minimum length for Project text properties */
        application.createConstant(this, 'MIN_TEXT_FIELD_LENGTH', 5);

        this.application = application;
        this.sqlite3 = application.getSqlite3();
    };

    /**
     * @returns {Project} new blank project
     */
    create() {
        return new Project(-1, '');
    };

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
        this.sqlite3.get(
            'SELECT id, name FROM project WHERE (id = ?)',
            [
                id
            ],
            function (error, row) {
                if (typeof row === 'undefined') {
                    callback(null, null);
                } else if (error === null) {
                    callback(new Project(row.id, row.name), null);
                }  else {
                    callback(null, error);
                }
            }
        );
    };

    /**
     * Fetch all projects
     *
     * @param {ProjectOperationCallback} callback - project operation callback
     */
    getAll(callback) {
        var projects = {};

        this.sqlite3.each("SELECT id, name FROM project", function (error, row) {
            if (error === null) {
                var project = new Project(row.id, row.name);
                projects[project.getId()] = project;
            } else {
                callback({}, error);
            }
        }, function (error) {
            callback(projects, error);
        });
    };

    /**
     * @param {string} name - project's name
     * @param {number} currentProjectId - which project to skip
     * @param {callback} callback - {boolean} true, if project with given name already exists, skipping current one
     */
    doesExistWithSameName(name, currentProjectId, callback) {
        this.sqlite3.get(
            'SELECT id FROM project WHERE (id <> ?) AND (name = ?)',
            [
                currentProjectId,
                name
            ],
            function (error, row) {
                if (typeof row === 'undefined') {
                    callback(false);
                } else if (error === null) {
                    callback(true);
                }  else {
                    console.log(error);
                    callback(true);
                }
            }
        );
    };

    /**
     * @param {Project} project - project to explore
     * @param {User} user - user to explore
     * @param {callback} callback - {boolean} true, if given user has admin role in given project, false otherwise
     */
    isUserAdmin(project, user, callback) {
        if (
            this.application.getUserManager().isUserSuper(user) ||
            this.application.getUserManager().isUserAdmin(user)
        ) {
            return callback(true);
        }

        this.sqlite3.get(
            'SELECT role FROM project_user WHERE (project_id = ?) AND (user_id = ?) AND (role = ?)',
            [
                project.getId(),
                user.getId(),
                this.ROLE_ADMIN
            ],
            function (error, row) {
                if (typeof row === 'undefined') {
                    callback(false);
                } else if (error === null) {
                    callback(true);
                }  else {
                    console.log(error);
                    callback(false);
                }
            }
        );
    };

    /**
     * Add a new project, also save to the database
     *
     * @param {Project} project - new project
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    add(project, callback) {
        this.sqlite3.run(
            'INSERT INTO project (name) VALUES (?)',
            [
                project.getName()
            ], function(error) {
                if (error === null) {
                    project.setId(this.lastID);
                    callback(null);
                } else {
                    console.log(error);
                    callback(true);
                }
            }
        );
    };

    /**
     * Update project data
     *
     * @param {Project} project - project with new values
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    update(project, callback) {
        this.sqlite3.run(
            'UPDATE project SET name = ? WHERE id = ?',
            [
                project.getName(),
                project.getId()
            ], function(error) {
                if (error === null) {
                    if (this.changes === 0) {
                        console.log('No rows were updated');
                        callback(true)
                    } else {
                        callback(null);
                    }
                } else {
                    console.log(error);
                    callback(true);
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
        this.sqlite3.run(
            'DELETE FROM project_user WHERE user_id = ?',
            [
                userId
            ],
            function(error) {
                if (error === null) {
                    if (this.changes === 0) {
                        console.log('No rows were deleted');
                        callback(true);
                    } else {
                        callback(null);
                    }
                } else {
                    console.log(error);
                    callback(true);
                }
            }
        )
    };

    /**
     * @param {number} userId - user id
     * @param {callback} callback - {Object.<number, number>} project_id x role
     */
    getUserRoleInProjects(userId, callback) {
        var roles = {};

        this.sqlite3.each(
            'SELECT role, project_id FROM project_user WHERE (user_id = ?)',
            [
                userId
            ],
            function(error, row) {
                if (error === null) {
                    roles[row.project_id] = row.role;
                } else {
                    callback({}, error);
                }
            }, function (error) {
                callback(roles, error);
            }
        );
    };

    /**
     * Set given roles for given user
     *
     * @param {number} userId - user id
     * @param {Object.<number, number>} roles - list of roles, where keys are projects ids and values - roles
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    setUserRoleInProject(userId, roles, callback) {
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

        this.sqlite3.run(query, [], function(error) {
            if (error === null) {
                return callback(null);
            } else {
                console.log(error);
                return callback(true);
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
        var projects = {};

        this.sqlite3.each(
            'SELECT' +
            '   role, project.id AS id, project.name AS name ' +
            'FROM ' +
            '   project_user LEFT JOIN project ' +
            'ON ' +
            '   (project_user.project_id = project.id) ' +
            'WHERE ' +
            '   (user_id = ?)',
            [
                user.getId()
            ],
            function(error, row) {
                if (error === null) {
                    var project = new Project(row.id, row.name);

                    projects[project.getId()] = {
                        project: project,
                        role: row.role
                    };
                } else {
                    callback({}, error);
                }
            }, function (error) {
                callback(projects, error);
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
        
        this.sqlite3.run('DELETE FROM project_user WHERE project_id = ?', [projectId], function(error) {
            if (error === null) {
                self.sqlite3.run('DELETE FROM project WHERE id = ?', [projectId], function(error) {
                   if (error === null) {
                       callback(null);
                   } else {
                       console.log(error);
                       callback(true);
                   }
                });
            } else {
                console.log(error);
                callback(true);
            }
        });
    };
}

module.exports = ProjectManager;
