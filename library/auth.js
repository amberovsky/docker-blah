"use strict";

/**
 * auth.js - Performs authentication tasks
 *
 * (C) Anton Zagorskii aka amberovsky
 */

class Auth {

    /**
     * @constructor
     * 
     * @param {Application} application - application
     */
    constructor(application) {
        /** @property {number} AUTH_NO_USER - @constant for AUTH_NO_USER auth result */
        application.createConstant(this, 'AUTH_NO_USER', -1);

        /** @property {number} AUTH_WRONG_PASSWORD - @constant for AUTH_WRONG_PASSWORD auth result */
        application.createConstant(this, 'AUTH_WRONG_PASSWORD', -2);
        
        this.application = application;
    };

    /**
     *
     * @param {string} password - plain password
     *
     * @returns {string} securely hashed password
     */
    hashPassword(password) {
        return password;
    };

    /**
     * Callback for auth operation
     *
     * @callback AuthCallback
     *
     * @param {(null|User)} user - user if success, null otherwise
     * @param {(null|number)} error - error code, null otherwise
     */

    /**
     * Perform authentication
     *
     * @param {string} login - user login
     * @param {string} password - user password
     * @param {AuthCallback} callback - auth callback
     */
    auth(login, password, callback) {
        var passwordHash = this.hashPassword(password);

        this.application.getUserManager().getByLoginAndPasswordHash(login, passwordHash, (user, error) => {
            if (error === null) {
                if (user === null) {
                    callback(null, this.AUTH_NO_USER);
                } else  {
                    callback(user, null);
                }
            } else {
                callback(null, error)
            }
        });
    }

    /**
     * Check is given password equals to hashed password
     *
     * @param {string} hash - password hash
     * @param {string} password - password
     *
     * @returns {boolean} same or not
     */
    checkPasswordMatch(hash, password) {
        return (hash == this.hashPassword(password));
    };

}

module.exports = Auth;
