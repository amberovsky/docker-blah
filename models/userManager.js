"use strict";

/**
 * userManager.js - Manager for User. Responsible for saving, retrieving, search
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/** @type {User} */
var User = require('./user.js');

/** @type {Project} */
var Project = require('./project.js');

class UserManager {

    /**
     * Callback to be used for all operations with User
     *
     * @callback UserOperationCallback
     *
     * @param {(null|string)} error - error message
     * @param {(null|User|Object.<number, User>)} user - user (or list of users) after applied operation or null if no
     *                                                   user with given criteria
     */

    /**
     * @constructor
     *
     * @param {Application} application - application
     * @param {winston.Logger} logger - logger
     */
    constructor(application, logger) {
        /** @property {number} ROLE_SUPER - @constant for SUPER role */
        application.createConstant(this, 'ROLE_SUPER', 1);

        /** @property {number} ROLE_ADMIN - @constant for ADMIN role */
        application.createConstant(this, 'ROLE_ADMIN', 2);
        
        /** @property {number} ROLE_USER - @constant for USER role */
        application.createConstant(this, 'ROLE_USER', 3);

        /** @property {number} MIN_TEXT_FIELD_LENGTH - @constant minimum length for User text properties */
        application.createConstant(this, 'MIN_TEXT_FIELD_LENGTH', 5);
        
        this.sqlite3 = application.getSqlite3();
        this.logger = logger;
    };

    /**
     * @returns {User} new blank user
     */
    create() {
        return new User(-1, '', '', '', this.ROLE_USER, -1);
    };

    /**
     * Add a new user, also save to the database
     *
     * @param {User} user - new user
     * @param {DatabaseOperationCallback} callback - user operation callback
     */
    add(user, callback) {
        var self = this;

        this.sqlite3.run(
            'INSERT INTO user (name, login, password_hash, role, local_id) VALUES (?, ?, ?, ?, ?)',
            [
                user.getName(),
                user.getLogin(),
                user.getPasswordHash(),
                user.getRole(),
                user.getLocalId()
            ], function (error) {
                if (error === null) {
                    user.setId(this.lastID);
                    callback(null);
                } else {
                    self.logger.error(error);
                    callback(true);
                }
            }
        );
    };

    /**
     * @param {User} user - user to explore
     *
     * @returns {string} string role representation of given user
     */
    getRoleCaption(user) {
        switch(user.getRole()) {
            case this.ROLE_SUPER:
                return 'SUPER';
                break;

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
            'SUPER': this.ROLE_SUPER,
            'ADMIN': this.ROLE_ADMIN,
            'USER': this.ROLE_USER
        }
    };

    /**
     * @param {number} role - value to explore
     *
     * @returns {boolean} - if given value is a valid role
     */
    isRoleValid(role) {
        return (role === this.ROLE_SUPER) || (role === this.ROLE_ADMIN) || (role === this.ROLE_USER);
    };

    /**
     * @param {string} login - user's login
     * @param {number|null} currentUserId - which user to skip
     * @param {UserOperationCallback} callback - user operation callback
     */
    getByLogin(login, currentUserId, callback) {
        var self = this;

        this.sqlite3.get(
            'SELECT id, name, login, password_hash, role, local_id FROM user WHERE (login = ?) AND (id <> ?)',
            [
                login,
                (currentUserId === null ? -1 : currentUserId)
            ],
            function (error, row) {
                if (typeof row === 'undefined') {
                    callback(null, null);
                } else if (error === null) {
                    callback(
                        null,
                        new User(row.id, row.name, row.login, row.password_hash, row.role, row.local_id)
                    );
                }  else {
                    self.logger.error(error);
                    callback(error, null);
                }
            }
        );
    };

    /**
     * @param {string} login - user's login
     * @param {string} passwordHash - user's password hash
     * @param {UserOperationCallback} callback - user operation callback
     */
    getByLoginAndPasswordHash(login, passwordHash, callback) {
        var self = this;

        this.sqlite3.get(
            'SELECT id, name, login, password_hash, role, local_id FROM user WHERE (login = ?) AND (password_hash = ?)',
            [
                login,
                passwordHash
            ],
            function (error, row) {
                if (typeof row === 'undefined') {
                    callback(null, null);
                } else if (error === null) {
                    callback(
                        null,
                        new User(row.id, row.name, row.login, row.password_hash, row.role, row.local_id)
                    );
                }  else {
                    self.logger.error(error);
                    callback(error, null);
                }
            }
        );
    }

    /**
     * @param {number} id - user's id
     * @param {UserOperationCallback} callback - user operation callback
     */
    getById(id, callback) {
        var self = this;

        this.sqlite3.get(
            'SELECT id, name, login, password_hash, role, local_id FROM user WHERE (id = ?)',
            [
                id
            ],
            function (error, row) {
                if (typeof row === 'undefined') {
                    callback(null, null);
                } else if (error === null) {
                    callback(
                        null,
                        new User(row.id, row.name, row.login, row.password_hash, row.role, row.local_id)
                    );
                }  else {
                    self.logger.error(error);
                    callback(error, null);
                }
            }
        );
    };

    /**
     * Fetch all users
     * 
     * @param {UserOperationCallback} callback - user operation callback
     */
    getAll(callback) {
        var
            users = {},
            self = this;

        this.sqlite3.each("SELECT id, name, login, password_hash, role, local_id FROM user", function (error, row) {
            if (error === null) {
                var user = new User(row.id, row.name, row.login, row.password_hash, row.role, row.local_id);
                users[user.getId()] = user;
            } else {
                self.logger.error(error);
                callback(error, {});
            }
        }, function (error) {
            if (error !== null) {
                self.logger.error(error);
            }

            callback(error, users);
        });
    };

    /**
     * Update user data, also in the database
     *
     * @param {User} user - user with new values
     * @param {DatabaseOperationCallback} callback - user operation callback
     */
    update(user, callback) {
        var self = this;

        this.sqlite3.run(
            'UPDATE user SET name = ?, login = ?, role = ?, password_hash = ?, local_id = ? WHERE id = ?',
            [
                user.getName(),
                user.getLogin(),
                user.getRole(),
                user.getPasswordHash(),
                user.getLocalId(),
                user.getId()
            ], function (error) {
                if (error === null) {
                    if (this.changes === 0) {
                        self.logger.error('No rows were updated');
                        callback('No rows were updated');
                    } else {
                        callback(null);
                    }
                } else {
                    self.logger.error(error);
                    callback(true);
                }
            }
        );
    };

    /**
     * Delete user, also in the database
     *
     * @param {number} userId - user's id
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    deleteUser(userId, callback) {
        var self = this;

        this.sqlite3.run(
            'DELETE FROM user WHERE id = ?',
            [
                userId
            ],
            function (error) {
                if (error === null) {
                    if (this.changes === 0) {
                        self.logger.error('No rows were deleted');
                        callback('No rows were deleted');
                    } else {
                        self.logger.error(error);
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
     * Search for users with role, projectId or role in a project
     * 
     * @param {number} role - given role, -1 means no restriction
     * @param {number} projectId - project id, -1 means no restriction
     * @param {number} projectRole - project role, -1 means no restriction
     * @param {callback} callback - {Object.<User>, Object.<Project>}[] found users with corresponding projects,
     *                              indexed by user id
     */
    searchByCriteria(role, projectId, projectRole, callback) {
        var
            users = {},
            projects = {},
            roles = {},
            search = ['(1 = 1)'],
            params = {},
            self = this;

        if (role !== -1) {
            search.push('(user.role = $role)');
            params['$role'] = role;
        }

        if (projectId !== -1) {
            search.push('(project_user.project_id = $project_id)');
            params['$project_id'] = projectId;
        }

        if (projectRole !== -1) {
            search.push('(project_user.role = $project_role)');
            params['$project_role'] = projectRole;
        }

        var query = 'SELECT' +
            '   user.id AS u_i, user.name AS u_n, user.login AS u_l, user.password_hash AS u_ph, user.role AS u_r, ' +
            '   user.local_id AS u_li, project.id as p_i, project.name as p_n, project.created as p_c, ' +
            '   project_user.role as pu_r ' +
            'FROM ' +
            '   user LEFT JOIN project_user ON (project_user.user_id = user.id) ' +
            '   LEFT JOIN project ON (project.id = project_user.project_id) ' +
            'WHERE ' +
                search.join(' AND ');

        this.sqlite3.each(
            query,
            params,
            function (error, row) {
                if (error === null) {
                    var user = new User(row.u_i, row.u_n, row.u_l, row.u_ph, row.u_r, row.u_li);

                    users[user.getId()] = user;

                    if (row.p_i !== null) {
                        var project = new Project(row.p_i, row.p_n);

                        projects[user.getId()] = projects[user.getId()] || {};
                        projects[user.getId()][project.getId()] = project;

                        roles[user.getId()] = roles[user.getId()] || {};
                        roles[user.getId()][project.getId()] = row.pu_r;
                    }
                } else {
                    self.logger.error(error);
                    callback(error, { users: {}, projects: {}, roles: {} });
                }
            }, function (error) {
                if (error !== null) {
                    self.logger.error(error);
                }

                callback(error, { users: users, projects: projects, roles: roles });
            }
        );
    }

    /**
     * @param {User} user - user
     *
     * @returns {boolean} is the role of given user - admin?
     */
    isUserAdmin(user) {
        return (user.getRole() === this.ROLE_ADMIN);
    };

    /**
     * @param {User} user - user
     *
     * @returns {boolean} is the role of given user - super?
     */
    isUserSuper(user) {
        return (user.getRole() === this.ROLE_SUPER);
    };

    /**
     * @param {User} user - user
     *
     * @returns {boolean} is the role of given user - user?
     */
    isUserUser(user) {
        return (user.getRole() === this.ROLE_USER);
    };
}

module.exports = UserManager;
