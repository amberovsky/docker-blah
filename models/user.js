"use strict";

/**
 * user.js - User model
 *
 * (C) Anton Zagorskii aka amberovsky
 */

class User {

    /**
     * @constructor
     * 
     * @param {number} id - id
     * @param {string} name - name
     * @param {string} login - login
     * @param {string} passwordHash - password hash
     * @param {number} role - role, {@see UserManager}
     * @param {number} localId - id for project for local configured docker, -1 otherwise
     */
    constructor (id, name, login, passwordHash, role, localId) {
        /** @type {number} id */
        this.id = id;

        /** @type {string} name */
        this.name = name;

        /** @type {string} login */
        this.login = login;

        /** @type {string} password hash */
        this.passwordHash = passwordHash;

         /** @type {number} role */
        this.role = role;
        
        /** @type {number} localId - id for project for local configured docker, -1 otherwise */
        this.localId = localId;
    };

    /**
     * @returns {number} id
     */
    getId() {
        return this.id;
    };

    /**
     * Set new id
     *
     * @param id {number} - new id
     *
     * @returns {User}
     */
    setId(id) {
        this.id = id;

        return this;
    };

    /**
     * 
     * @returns {string} name
     */
    getName() {
        return this.name;
    };

    /**
     * Set new name
     * 
     * @param {string} name - new name
     * 
     * @returns {User}
     */
    setName(name) {
        this.name = name;

        return this;
    };

    /**
     * @returns {string} login
     */
    getLogin() {
        return this.login;
    };

    /**
     * Set new login
     * 
     * @param {string} login - new login
     * 
     * @returns {User}
     */
    setLogin(login) {
        this.login = login;
        
        return this;
    };

    /**
     * @returns {string} password hash
     */
    getPasswordHash() {
        return this.passwordHash;
    };

    /**
     * Set new password hash
     * 
     * @param {string} passwordHash - new password hash
     * 
     * @returns {User}
     */
    setPasswordHash(passwordHash) {
        this.passwordHash = passwordHash;
        
        return this;
    };

    /**
     * @returns {number} role
     */
    getRole() {
        return this.role;
    };

    /**
     * Set new role
     * 
     * @param {number} role - new role
     * 
     * @returns {User}
     */
    setRole(role) {
        this.role = role;

        return this;
    };

    /**
     * @returns {number} id for project for local configured docker, -1 otherwise
     */
    getLocalId() {
        return this.localId;
    }

    /**
     * @param {number} localId - id for project for local configured docker, -1 otherwise
     * 
     * @returns {User}
     */
    setLocalId(localId) {
        this.localId = localId;
        
        return this;
    }

}

module.exports = User;
