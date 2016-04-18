"use strict";

var User = require('./user.js');

class UserManager {

    constructor(app, sqlite3, callback) {
        this.app = app;
        this.sqlite3 = sqlite3;
        this.users = {};

        var self = this;
        this.sqlite3.each("SELECT id, name, login, password_hash, role FROM user", function(err, row) {
            var user = new User(row.id, row.name, row.login, row.password_hash, row.role);
            self.users[user.getId()] = user;
        }, callback);

        app.createConstant(this, 'ROLE_SUPER', 1);
        app.createConstant(this, 'ROLE_ADMIN', 2);
        app.createConstant(this, 'ROLE_USER', 3);

        app.createConstant(this, 'MIN_TEXT_FIELD_LENGTH', 5);
    };

    create() {
        return new User(-1, '', '', '', this.ROLE_USER);
    }

    add(user, callback) {
        var self = this;
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
                    self.users[user.getId()] = user;
                    callback(false);
                } else {
                    console.log(error);
                    callback(true);
                }
            }
        );
    }

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
    }

    getRoles() {
        return {
            'SUPER': this.ROLE_SUPER,
            'ADMIN': this.ROLE_ADMIN,
            'USER': this.ROLE_USER
        }
    }

    isRoleValid(role) {
        return (role === this.ROLE_SUPER) || (role === this.ROLE_ADMIN) || (role === this.ROLE_USER);
    }

    getByLogin(login, currentUserId) {
        for (var index in this.users) {
            if ((this.users[index].getLogin() === login) && (this.users[index].getId() !== currentUserId)) {
                return this.users[index];
            }
        }

        return null;
    }
    
    getById(id) {
        return this.users.hasOwnProperty(id) ? this.users[id] : null;
    }

    getAll() {
        return this.users;
    }

    update(user, callback) {
        var self = this;

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
                        self.users[user.getId()] = user;
                        callback(false);
                    }
                } else {
                    console.log(error);
                    callback(true);
                }
            }
        );
    }

    deleteUser(userId, callback) {
        var self = this;

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
                        delete self.users[userId];

                        callback(false);
                    }
                } else {
                    console.log(error);
                    callback(true);
                }
            }
        )
    }
}

module.exports = UserManager;
