"use strict";

var Project = require('./project.js');

class ProjectManager {

    constructor(app, sqlite3, callback) {
        this.app = app;
        this.sqlite3 = sqlite3;
        this.projects = {};
        this.projectUser = {};

        app.createConstant(this, 'ROLE_ADMIN', 1);
        app.createConstant(this, 'ROLE_USER', 2);

        app.createConstant(this, 'MIN_TEXT_FIELD_LENGTH', 5);

        var self = this;
        this.sqlite3.each("SELECT id, name FROM project", function(err, row) {
            var project = new Project(row.id, row.name);
            self.projects[project.getId()] = project;
        }, function() {
            self.sqlite3.each("SELECT project_id, user_id, role FROM project_user", function (err, row) {
                self.projectUser[row.project_id] = self.projectUser[row.project_id] || {};
                self.projectUser[row.project_id][row.user_id] = row.role;
            }, callback)
        });
    };

    create() {
        return new Project(-1, '');
    }

    getRoleCaption(role) {
        switch(role) {
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
            'ADMIN': this.ROLE_ADMIN,
            'USER': this.ROLE_USER
        }
    }

    isRoleValid(role) {
        return (role == this.ROLE_ADMIN) || (role == this.ROLE_USER);
    }

    getById(id) {
        return this.projects.hasOwnProperty(id) ? this.projects[id] : null;
    }

    getAll() {
        return this.projects;
    }
    
    getByName(name, currentProjectId) {
        for (var index in this.projects) {
            if ((this.projects[index].getName() === name) && (this.projects[index].getId() !== currentProjectId)) {
                return this.projects[index];
            }
        }

        return null;
    }

    isUserAdmin() {
        return true;
    }
    
    add(project, callback) {
        var self = this;
        this.sqlite3.run(
            'INSERT INTO project (name) VALUES (?)',
            [
                project.getName()
            ], function(error) {
                if (error === null) {
                    project.setId(this.lastID);
                    self.projects[project.getId()] = project;
                    callback(false);
                } else {
                    console.log(error);
                    callback(true);
                }
            }
        );
    }
    
    update(project, callback) {
        var self = this;

        this.sqlite3.run(
            'UPDATE project SET name = ? WHERE id = ?',
            [
                project.getName(),
                project.getId()
            ], function(error) {
                if (error === null) {
                    if (this.changes === 0) {
                        console.log('No rows were updated');
                        callback(true)
                    } else {
                        self.projects[project.getId()] = project;
                        callback(false);
                    }
                } else {
                    console.log(error);
                    callback(true);
                }
            }
        );
    }
    
    deleteUserFromAllProjects(userId, callback) {
        var self = this;

        this.sqlite3.run(
            'DELETE FROM project_user WHERE user_id = ?',
            [
                userId
            ],
            function(error) {
                if (error === null) {
                    if (this.changes === 0) {
                        console.log('No rows were deleted');
                        callback(true);
                    } else {
                        for (var projectId in self.projectUser) {
                            if (self.projectUser[projectId].hasOwnProperty(userId)) {
                                delete self.projectUser[projectId][userId];
                            }
                        }

                        callback(false);
                    }
                } else {
                    console.log(error);
                    callback(true);
                }
            }
        )
    }
    
    getUserRoleInProject(userId, projectId) {
        if (!this.projectUser.hasOwnProperty(projectId)) {
            return -1;
        }

        return this.projectUser[projectId].hasOwnProperty(userId)
            ? this.projectUser[projectId][userId]
            : -1;
    }
    
    setUserRoleInProject(userId, roles, callback) {
        if (Object.keys(roles).length == 0) {
            return callback(false);
        }

        var
            self = this,
            addComma = false,
            query = 'INSERT OR REPLACE INTO project_user (project_id, user_id, role) VALUES ';

        for (var projectId in roles) {
            if (addComma) {
                query += ', ';
            } else {
                addComma = true;
            }

            query += '(' + projectId + ', ' + userId + ', ' + roles[projectId] + ')';
        }
        
        this.sqlite3.run(query, [], function(error) {
            if (error === null) {
                for (var projectId in roles) {
                    self.projectUser[projectId] = self.projectUser[projectId] || {};
                    self.projectUser[projectId][userId] = roles[projectId];
                }

                callback(false);
            } else {
                console.log(error);
                callback(true);
            }
        });
    }

    getAllForUser(user) {
        var projects = [];

        for (var index in this.projectUser) {
            if (this.projectUser[index].hasOwnProperty(user.getId())) {
                projects.push({
                    project: this.projects[index],
                    role: this.projectUser[index][user.getId()]
                });
            }
        }

        return projects;
    }
}

module.exports = ProjectManager;
