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
     * Callback to be used for all database operations
     *
     * @callback UserOperationCallback
     *
     * @param {(null|User|Object.<number, User>)} user - user (or list of users) after applied operation or null if no
     *                                                   user with given criteria
     * @param {(null|string)} error - error message
     */

    /**
     * @constructor
     *
     * @param {Application} application - application
     */
    constructor(application) {
        /** @property {number} ROLE_SUPER - @constant for SUPER role */
        application.createConstant(this, 'ROLE_SUPER', 1);

        /** @property {number} ROLE_ADMIN - @constant for ADMIN role */
        application.createConstant(this, 'ROLE_ADMIN', 2);
        
        /** @property {number} ROLE_USER - @constant for USER role */
        application.createConstant(this, 'ROLE_USER', 3);

        /** @property {number} MIN_TEXT_FIELD_LENGTH - @constant minimum length for User text properties */
        application.createConstant(this, 'MIN_TEXT_FIELD_LENGTH', 5);
        
        this.sqlite3 = application.getSqlite3();
    };

    /**
     * @returns {User} new blank user
     */
    create() {
        return new User(-1, '', '', '', this.ROLE_USER);
    };

    /**
     * Add a new user, also save to the database
     *
     * @param {User} user - new user
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    add(user, callback) {
        this.sqlite3.run(
            'INSERT INTO user (name, login, password_hash, role) VALUES (?, ?, ?, ?)',
            [
                user.getName(),
                user.getLogin(),
                user.getPasswordHash(),
                user.getRole()
            ], function(error) {
                if (error === null) {
                    user.setId(this.lastID);
                    callback(null);
                } else {
                    console.log(error);
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
        this.sqlite3.get(
            'SELECT id, name, login, password_hash, role FROM user WHERE (login = ?) AND (id <> ?)',
            [
                login,
                (currentUserId === null ? -1 : currentUserId)
            ],
            function (error, row) {
                if (typeof row === 'undefined') {
                    callback(null, null);
                } else if (error === null) {
                    callback(new User(row.id, row.name, row.login, row.password_hash, row.role), null);
                }  else {
                    callback(null, error);
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
        this.sqlite3.get(
            'SELECT id, name, login, password_hash, role FROM user WHERE (login = ?) AND (password_hash = ?)',
            [
                login,
                passwordHash
            ],
            function (error, row) {
                if (typeof row === 'undefined') {
                    callback(null, null);
                } else if (error === null) {
                    callback(new User(row.id, row.name, row.login, row.password_hash, row.role), null);
                }  else {
                    callback(null, error);
                }
            }
        );
    }

    /**
     * @param {number} id - user's id
     * @param {UserOperationCallback} callback - user operation callback
     */
    getById(id, callback) {
        this.sqlite3.get(
            'SELECT id, name, login, password_hash, role FROM user WHERE (id = ?)',
            [
                id
            ],
            function (error, row) {
                if (typeof row === 'undefined') {
                    callback(null, null);
                } else if (error === null) {
                    callback(new User(row.id, row.name, row.login, row.password_hash, row.role), null);
                }  else {
                    callback(null, error);
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
        var users = {};

        this.sqlite3.each("SELECT id, name, login, password_hash, role FROM user", function (error, row) {
            if (error === null) {
                var user = new User(row.id, row.name, row.login, row.password_hash, row.role);
                users[user.getId()] = user;
            } else {
                callback({}, error);
            }
        }, function (error) {
            callback(users, error);
        });
    };

    /**
     * Update user data, also in the database
     *
     * @param {User} user - user with new values
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    update(user, callback) {
        this.sqlite3.run(
            'UPDATE user SET name = ?, login = ?, role = ?, password_hash = ? WHERE id = ?',
            [
                user.getName(),
                user.getLogin(),
                user.getRole(),
                user.getPasswordHash(),
                user.getId()
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
     * Delete user, also in the database
     *
     * @param {number} userId - user's id
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    deleteUser(userId, callback) {
        this.sqlite3.run(
            'DELETE FROM user WHERE id = ?',
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
            search = ['(1 = 1)'],
            params = {};

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
            '   project.id as p_i, project.name as p_n ' +
            'FROM ' +
            '   user LEFT JOIN project_user ON (project_user.user_id = user.id) ' +
            '   LEFT JOIN project ON (project.id = project_user.project_id) ' +
            'WHERE ' +
                search.join(' AND ');

        this.sqlite3.each(
            query,
            params,
            function(error, row) {
                if (error === null) {
                    var user = new User(row.u_i, row.u_n, row.u_l, row.u_ph, row.u_r);
                    var project = new Project(row.p_i, row.p_n);

                    users[user.getId()] = user;
                    projects[user.getId()] = projects[user.getId()] || {};
                    projects[user.getId()][project.getId()] = project;
                } else {
                    console.log(error);
                    callback({ users: {}, projects: {} }, error);
                }
            }, function (error) {
                if (error !== null) {
                    console.log(error);
                }
                callback({ users: users, projects: projects }, error);
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
