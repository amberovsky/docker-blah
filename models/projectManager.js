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
        /** @property {number} ROLE_ADMIN - @constant for ADMIN role */
        application.createConstant(this, 'ROLE_ADMIN', 1);

        /** @property {number} ROLE_USER - @constant for USER role */
        application.createConstant(this, 'ROLE_USER', 2);


        /** @property {number} MIN_TEXT_FIELD_LENGTH - @constant minimum length for Project text properties */
        application.createConstant(this, 'MIN_TEXT_FIELD_LENGTH', 5);

        this.application = application;
        this.sqlite3 = application.getSqlite3();
        this.projects = {};
        this.projectUser = {};

        var self = this;
        this.sqlite3.each("SELECT id, name FROM project", function(error, row) {
            if (error === null) {
                var project = new Project(row.id, row.name);
                self.projects[project.getId()] = project;
            } else {
                console.log(error);
            }
        }, function(error) {
            if (error === null) {
                self.sqlite3.each("SELECT project_id, user_id, role FROM project_user", function(error, row) {
                    if (error === null) {
                        self.projectUser[row.project_id] = self.projectUser[row.project_id] || {};
                        self.projectUser[row.project_id][row.user_id] = row.role;
                    } else {
                        console.log(error);
                    }
                }, callback)
            } else {
                console.log(error);
            }
        });
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
     *
     * @returns {(null|Project)} project with given id, or null if such project doesn't exist
     */
    getById(id) {
        return this.projects.hasOwnProperty(id) ? this.projects[id] : null;
    };

    /**
     * @returns {Object.<number, Project>} all projects
     */
    getAll() {
        return this.projects;
    };

    /**
     *
     * @param {string} name - project's name
     * @param {number} currentProjectId - which project to skip
     *
     * @returns {(null|Project)} project with given name, or null if such project doesn't exist
     */
    getByName(name, currentProjectId) {
        for (var index in this.projects) {
            if ((this.projects[index].getName() === name) && (this.projects[index].getId() !== currentProjectId)) {
                return this.projects[index];
            }
        }

        return null;
    };

    /**
     * @param {Project} project - project to explore
     * @param {User} user - user to explore
     *
     * @returns {boolean} true, if given user has admin role in given project, false otherwise
     */
    isUserAdmin(project, user) {
        if (
            this.application.getDockerBlah().getUserManager().isUserSuper(user) ||
            this.application.getDockerBlah().getUserManager().isUserAdmin(user)
        ) {
            return true;
        }

        return (
            !this.projectUser.hasOwnProperty(project.getId()) ||
            !this.projectUser[project.getId()].hasOwnProperty(user.getId())
        )
        ? false
        : (this.projectUser[project.getId()][user.getId()] === this.ROLE_ADMIN);
    };

    /**
     * Add a new project, also save to the database
     *
     * @param {Project} project - new project
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    add(project, callback) {
        var self = this;
        this.sqlite3.run(
            'INSERT INTO project (name) VALUES (?)',
            [
                project.getName()
            ], function(error) {
                if (error === null) {
                    project.setId(this.lastID);
                    self.projects[project.getId()] = project;
                    callback(null);
                } else {
                    console.log(error);
                    callback(true);
                }
            }
        );
    };

    /**
     * Update project data, also in the database
     *
     * @param {Project} project - project with new values
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    update(project, callback) {
        var self = this;

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
                        self.projects[project.getId()] = project;
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
     * Delete given user prom all projects, also in the database
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
            function(error) {
                if (error === null) {
                    if (this.changes === 0) {
                        console.log('No rows were deleted');
                        callback(true);
                    } else {
                        for (var projectId in self.projectUser) {
                            if (self.projectUser[projectId].hasOwnProperty(userId)) {
                                delete self.projectUser[projectId][userId];
                            }
                        }

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
     * @param {number} projectId - project id
     *
     * @returns {number} -1 if given user doesn't have any roles in the given project, role otherwise
     */
    getUserRoleInProject(userId, projectId) {
        if (!this.projectUser.hasOwnProperty(projectId)) {
            return -1;
        }

        return this.projectUser[projectId].hasOwnProperty(userId)
            ? this.projectUser[projectId][userId]
            : -1;
    };

    /**
     * Set given roles for given user, also in the database
     *
     * @param {number} userId - user id
     * @param {Object.<number, number>} roles - list of roles, where keys are projects ids and values - roles
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    setUserRoleInProject(userId, roles, callback) {
        if (Object.keys(roles).length == 0) {
            callback(false);
        }

        var
            self = this,
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
                for (var projectId in roles) {
                    self.projectUser[projectId] = self.projectUser[projectId] || {};
                    self.projectUser[projectId][userId] = roles[projectId];
                }

                callback(null);
            } else {
                console.log(error);
                callback(true);
            }
        });
    };

    /**
     * Get list of all projects with roles wich given user has
     *
     * @param {User} user - user
     *
     * @returns {Object.<Project, number>[]} - array of Project x role for given user
     */
    getAllForUser(user) {
        var projects = [];

        for (var index in this.projectUser) {
            if (this.projectUser[index].hasOwnProperty(user.getId())) {
                projects.push({
                    project: this.projects[index],
                    role: this.projectUser[index][user.getId()]
                });
            }
        }

        return projects;
    };

    /**
     * Delete project,  also in the database
     *
     * @param {number} projectId - project id
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    deleteProject(projectId, callback) {
        var self = this;
        
        this.sqlite3.run('DELETE FROM project_user WHERE project_id = ?', [projectId], function(error) {
            if (error === null) {
                delete self.projectUser[projectId];
                
                self.sqlite3.run('DELETE FROM project WHERE id = ?', [projectId], function(error) {
                   if (error === null) {
                       delete self.projects[projectId];
                       
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
