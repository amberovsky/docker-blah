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
        return this.projects[id];
    }

    getAll() {
        return this.projects;
    }

    isUserAdmin() {
        return true;
    }
    
    getUserRoleInProject(userId, projectId) {
        if (!this.projectUser.hasOwnProperty(projectId)) {
            return -1;
        }

        return this.projectUser[projectId].hasOwnProperty(userId)
            ? this.projectUser[projectId][userId]
            : -1;
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
