"use strict";

/**
 * users.js - admin actions about users
 * 
 * /admin/users/*
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function(application) {

    var dockerBlah = application.getDockerBlah();

    application.getExpress().get('/admin/users/create/', function (request, response) {
        response.render('admin/user.html.twig', {
            action: 'admin.users',
            user: dockerBlah.getUserManager().create(),
            subaction: 'create'
        });
    });

    application.getExpress().post('/admin/users/create/', function (request, response) {
        var
            roles = {},
            user = dockerBlah.getUserManager().create(),
            validation = validateUserActionCreateNewOrUpdateUser(request, user, roles, false);

        if (validation !== true) {
            return response.render('admin/user.html.twig', {
                action: 'admin.users',
                user: dockerBlah.getUserManager().create(),
                subaction: 'create',
                error: validation
            });
        }

        dockerBlah.getUserManager().add(user, function(error) {
            if (error === null) {
                dockerBlah.getProjectManager().setUserRoleInProject(user.getId(), roles, function (error) {
                    if (error === null) {
                        return response.render('admin/user.html.twig', {
                            action: 'admin.users',
                            user: dockerBlah.getUserManager().create(),
                            subaction: 'create',
                            success: 'User [' + user.getLogin() + '] was created.'
                        });
                    } else {
                        return response.render('admin/user.html.twig', {
                            action: 'admin.users',
                            user: user,
                            subaction: 'create',
                            error: 'Got error during create. Contact your system administrator.'
                        });
                    }
                });
            } else {
                return response.render('admin/user.html.twig', {
                    action: 'admin.users',
                    user: user,
                    subaction: 'create',
                    error: 'Got error during create. Contact your system administrator.'
                });
            }
        });
    });

    application.getExpress().all('/admin/users/:userId/*', function(request, response, next) {
        request.userId = parseInt(request.params.userId);
        request.user = Number.isNaN(request.userId)
            ? null
            : dockerBlah.getUserManager().getById(request.userId);

        next();
    });

    /**
     * Validate request for create new user or update existing
     *
     * @param {Object} request - express request
     * @param {User} user - new/existing user
     * @param {Object} roles - will be populated new with new roles in each project for given user, projectId x role
     * @param {boolean} isUpdate - is it update operation or create new
     *
     * @returns {(boolean|string)} - true, if validation passed, error message otherwise
     */
    function validateUserActionCreateNewOrUpdateUser(request, user, roles, isUpdate) {
        var
            name = request.body.name,
            login = request.body.login,
            password = request.body.password,
            role = request.body.role,
            passwordHash = '';

        if (
            (typeof name === 'undefined') ||
            (typeof login === 'undefined') ||
            (typeof name === 'undefined') ||
            (typeof role === 'undefined')
        ) {
            return 'Not enough data in the request.';
        }

        name = name.trim();
        login = login.trim();
        password = password.trim();
        role = parseInt(role, 10);

        if (
            (name.length < dockerBlah.getUserManager().MIN_TEXT_FIELD_LENGTH) ||
            (login.length < dockerBlah.getUserManager().MIN_TEXT_FIELD_LENGTH)
        ) {
            return 'Name and login should be at least ' + dockerBlah.getUserManager().MIN_TEXT_FIELD_LENGTH +
                ' characters.';
        }

        if (!isUpdate || (password.length > 0)) {
            if (password.length < dockerBlah.getUserManager().MIN_TEXT_FIELD_LENGTH) {
                return 'Password should be at least ' + dockerBlah.getUserManager().MIN_TEXT_FIELD_LENGTH +
                    ' characters.';
            }

            passwordHash = dockerBlah.getAuth().hashPassword(password);
        } else {
            passwordHash = user.getPasswordHash();
        }

        if (dockerBlah.getUserManager().getByLogin(login, (isUpdate === true) ? user.getId() : -1) !== null) {
            return 'User with login [' + login + '] already exists.';
        }

        if (Number.isNaN(role) && !dockerBlah.getUserManager().isRoleValid(role)) {
            return 'New role is invalid.';
        }

        var projects = dockerBlah.getProjectManager().getAll();

        for (var projectId in projects) {
            var roleInProject = request.body['role_' + projectId];

            if (typeof roleInProject !== 'undefined') {
                roleInProject = parseInt(roleInProject, 10);

                if (roleInProject !== -1) {
                    if (!dockerBlah.getProjectManager().isRoleValid(roleInProject)) {
                        return 'Role for project [' + projects[projectId].getName() + '] is invalid.';
                    }

                    roles[projectId] = roleInProject;
                }
            }
        }

        user
            .setName(name)
            .setLogin(login)
            .setRole(role)
            .setPasswordHash(passwordHash);

        return true;
    };

    application.getExpress().post('/admin/users/:userId/', function (request, response) {
        var users = dockerBlah.getUserManager().getAll();

        if (request.user === null) {
            return response.render('admin/users.html.twig', {
                action: 'admin.users',
                users: users,
                usersCount: Object.keys(users).length,
                error: 'User with given ID doesn\'t exist'
            });
        }

        var
            roles = {},
            validation = validateUserActionCreateNewOrUpdateUser(request, request.user, roles, true);

        if (validation !== true) {
            return response.render('admin/user.html.twig', {
                action: 'admin.users',
                users: users,
                usersCount: Object.keys(users).length,
                subaction: 'edit',
                error: validation
            });
        }

        dockerBlah.getUserManager().update(request.user, function(error) {
            if (error === null) {
                dockerBlah.getProjectManager().setUserRoleInProject(request.user.getId(), roles, function(error) {
                    if (error === null) {
                        return response.render('admin/user.html.twig', {
                            action: 'admin.users',
                            user: request.user,
                            subaction: 'edit',
                            success: 'User info was updated.'
                        });
                    } else {
                        return response.render('admin/user.html.twig', {
                            action: 'admin.users',
                            user: request.user,
                            subaction: 'edit',
                            error: 'Got error during update. Contact your system administrator.'
                        });
                    }
                });
            } else {
                return response.render('admin/user.html.twig', {
                    action: 'admin.users',
                    user: request.user,
                    subaction: 'edit',
                    error: 'Got error during update. Contact your system administrator.'
                });
            }
        });
    });

    application.getExpress().get('/admin/users/:userId/', function (request, response) {
        if (request.user === null) {
            var users = dockerBlah.getUserManager().getAll();

            return response.render('admin/users.html.twig', {
                action: 'admin.users',
                users: users,
                usersCount: Object.keys(users).length,
                error: 'User with given ID doesn\'t exist'
            });
        }

        response.render('admin/user.html.twig', {
            action: 'admin.users',
            user: request.user,
            caption: 'Edit user #' + request.user.getId()
        });
    });

    application.getExpress().get('/admin/users/', function (request, response) {
        var users = dockerBlah.getUserManager().getAll();

        response.render('admin/users.html.twig', {
            action: 'admin.users',
            users: users,
            usersCount: Object.keys(users).length
        });
    });

    application.getExpress().post('/admin/users/', function (request, response) {
        var
            role = request.body.role,
            project = request.body.project,
            projectRole = request.body.project_role;

        role = (typeof role === 'undefined') ? -1 : role;
        project = (typeof project === 'undefined') ? -1 : project;
        projectRole = (typeof projectRole === 'undefined') ? -1 : projectRole;

        var users = {};

        var allUsers = dockerBlah.getUserManager().getAll();
        for (var index in allUsers) {
            var
                add = true,
                user = allUsers[index];

            if (role != -1) {
                add = (user.getRole() == role);
            }

            if (add) {
                if (project != -1) {
                    add = (dockerBlah.getProjectManager().getUserRoleInProject(user.getId(), project) != -1);

                    if (add && (projectRole != -1)) {
                        add = (dockerBlah.getProjectManager().getUserRoleInProject(user.getId(), project) == projectRole);
                    }
                } else if (projectRole != -1) {
                    var
                        found = false,
                        allUserProjects = dockerBlah.getProjectManager().getAllForUser(user);
                    for (var index in allUserProjects) {
                        if (allUserProjects[index].role == projectRole) {
                            found  = true;
                            break;
                        }
                    }

                    if (!found) {
                        add = false;
                    }
                }
            }

            if (add) {
                users[user.getId()] = user;
            }
        }

        response.render('admin/users.html.twig', {
            action: 'admin.users',
            users: users,
            usersCount: Object.keys(users).length,
            selectedRole: role,
            selectedProject: project,
            selectedProjectRole: projectRole
        });
    });

    application.getExpress().get('/admin/users/:userId/delete/', function (request, response) {
        if (request.user === null) {
            var users = dockerBlah.getUserManager().getAll();

            return response.render('admin/users.html.twig', {
                action: 'admin.users',
                users: users,
                usersCount: Object.keys(users).length,
                error: 'User with given ID doesn\'t exist'
            });
        }

        response.render('admin/user.delete.html.twig', {
            action: 'admin.users'
        });
    });

    application.getExpress().post('/admin/users/:userId/delete/', function (request, response) {
        if (request.user === null) {
            var users = dockerBlah.getUserManager().getAll();

            return response.render('admin/users.html.twig', {
                action: 'admin.users',
                users: users,
                usersCount: Object.keys(users).length,
                error: 'User with given ID doesn\'t exist'
            });
        }

        dockerBlah.getProjectManager().deleteUserFromAllProjects(request.user.getId(), function(error) {
            var users = dockerBlah.getUserManager().getAll();

            if (error === null) {
                dockerBlah.getUserManager().deleteUser(request.user.getId(), function(error) {
                    if (error === null) {
                        return response.render('admin/users.html.twig', {
                            action: 'admin.users',
                            users: users,
                            usersCount: Object.keys(users).length,
                            success: 'User [' + request.user.getName() + '] was deleted.'
                        });
                    } else {
                        return response.render('admin/users.html.twig', {
                            action: 'admin.users',
                            users: users,
                            usersCount: Object.keys(users).length,
                            error: 'Got error during delete. Contact your system administrator.'
                        });
                    }
                });
            } else {
                return response.render('admin/users.html.twig', {
                    action: 'admin.users',
                    users: users,
                    usersCount: Object.keys(users).length,
                    error: 'Got error during delete. Contact your system administrator.'
                });
            }
        });
    });

};
