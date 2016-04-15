"use strict";

class User {
    
    constructor (id, name, login, passwordHash, role) {
        this.id = id;
        this.name = name;
        this.login = login;
        this.passwordHash = passwordHash;
        this.role = role;
    };

    getId() {
        return this.id;
    };

    setId(id) {
        this.id = id;

        return this;
    };


    getName() {
        return this.name;
    };

    setName(name) {
        this.name = name;

        return this;
    }

    getLogin() {
        return this.login;
    }
    
    setLogin(login) {
        this.login = login;
        
        return this;
    }

    getPasswordHash() {
        return this.passwordHash;
    }
    
    setPasswordHash(passwordHash) {
        this.passwordHash = passwordHash;
        
        return this;
    }

    getRole() {
        return this.role;
    }

    setRole(role) {
        this.role = role;

        return this;
    }
    
}

module.exports = User;
