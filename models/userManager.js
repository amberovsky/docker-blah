"use strict";

/**
 * userManager.js - Manager for User. Responsible for saving, retrieving, search
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/** @type {User} */
var User = require('./user.js');

class UserManager {

    /**
     * Callback to be used for all database operations
     *
     * @callback UserOperationCallback
     *
     * @param {(null|User)} user - user after applied operation or null if no user with given criteria
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
