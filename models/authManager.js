"use strict";

class AuthManager {
    
    constructor(app, sqlite3) {
        this.app = app;
        this.sqlite3 = sqlite3;

        app.createConstant(this, 'AUTH_NO_USER', -1);
        app.createConstant(this, 'AUTH_WRONG_PASSWORD', -2);
    };
    
    hashPassword(password) {
        return password;
    }
    
    auth(login, password) {
        var user = this.app.docker_blah.userManager.getByLogin(login);

        if (user === null) {
            return this.AUTH_NO_USER;
        }
        
        if (!this.checkPasswordMatch(user.getPasswordHash(), password)) {
             return this.AUTH_WRONG_PASSWORD;
        }
        
        return user.getId();
    }
    
    checkPasswordMatch(hash, password) {
        return (hash == this.hashPassword(password));
    }
    
}

module.exports = AuthManager;
