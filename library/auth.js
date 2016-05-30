"use strict";

/**
 * auth.js - Performs authentication tasks
 *
 * (C) Anton Zagorskii aka amberovsky amberovsky@gmail.com
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

        this.crypto = require('crypto');
        
        this.application = application;
    };

    /**
     *
     * @param {string} password - plain password
     * @param {(null|string)} salt - salt, will be generated if null
     *
     * @returns {{hash: string, salt: string}} hashed password & salt
     */
    hashPassword(password, salt = null) {
        if (salt === null) {
            salt = this.crypto.randomBytes(128).toString('hex');
        }

        const hash = this.crypto.pbkdf2Sync(password, salt, 100000, 512, 'sha512').toString('hex');
        console.log(hash);

        return {
            hash: hash,
            salt: salt
        };
    };

    /**
     * Callback for auth operation
     *
     * @callback AuthCallback
     *
     * @param {(null|number)} error - error code, null otherwise 
     * @param {(null|User)} user - user if success, null otherwise
     */

    /**
     * Perform authentication
     *
     * @param {string} login - user login
     * @param {string} password - user password
     * @param {AuthCallback} callback - auth callback
     */
    auth(login, password, callback) {
        this.application.getUserManager().getByLoginWithSalt(login, (error, user) => {
            if (error === null) {
                if (user === null) {
                    callback(this.AUTH_NO_USER, null);
                } else  {
                    const hashes = this.hashPassword(password, user.getSalt());
                    user.setSalt(''); // pray for safety!

                    if (hashes.hash === user.getPasswordHash()) {
                        callback(null, user);
                    } else {
                        callback(this.AUTH_WRONG_PASSWORD, null);
                    }
                }
            } else {
                callback(error, null)
            }
        });
    }

}

module.exports = Auth;
