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
     * Perform authentication
     *
     * @param {string} login - user login
     * @param {string} password - user password
     *
     * @returns {number} AUTH_NO_USER or AUTH_WRONG_PASSWORD if authentication was unsuccsessfull, user id otherwise
     */
    auth(login, password) {
        var user = this.application.getDockerBlah().getUserManager().getByLogin(login);

        if (user === null) {
            return this.AUTH_NO_USER;
        }

        if (!this.checkPasswordMatch(user.getPasswordHash(), password)) {
             return this.AUTH_WRONG_PASSWORD;
        }

        return user.getId();
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
