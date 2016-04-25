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
module.exports.controller = function (application) {

    /**
     * Create a user - page
     */
    application.getExpress().get('/admin/users/create/', function (request, response) {
        response.render('admin/user.html.twig', {
            action: 'admin.users',
            user: application.getUserManager().create(),
            subaction: 'create'
        });
    });

    /**
     * Create a user - handler
     */
    application.getExpress().post('/admin/users/create/', function (request, response) {
        var user = application.getUserManager().create();

        validateUserActionCreateNewOrUpdateUser(request, user, false, function (user, roles, error) {
            if (error !== null) {
                return response.render('admin/user.html.twig', {
                    action: 'admin.users',
                    user: application.getUserManager().create(),
                    subaction: 'create',
                    error: error
                });
            }

            application.getUserManager().add(user, function (error) {
                if (error === null) {
                    application.getProjectManager().setUserRoleInProject(user.getId(), roles, function (error) {
                        if (error === null) {
                            return response.render('admin/user.html.twig', {
                                action: 'admin.users',
                                user: application.getUserManager().create(),
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
    });

    /**
     * Middleware to preload user if there is a userId in the url
     */
    application.getExpress().all('/admin/users/:userId/*', function (request, response, next) {
        var userId = parseInt(request.params.userId);
        request.requestedUser = Number.isNaN(userId)
            ? null
            : application.getUserManager().getById(userId);

        next();
    });

    /**
     * Callback for update/create event
     *
     * @callback UserUpdateOrCreateCallback
     *
     * @param {(null|User)} user - new user | user with updated values, null if error happened
     * @param {(null|object)} roles - will be populated new with new roles in each project for given user,
     *                                  projectId x role, null if error happened
     * @param {(null|string)} error - error message, if error happened
     */

    /**
     * Validate request for create new user or update existing
     *
     * @param {Object} request - express request
     * @param {User} user - new/existing user
     * @param {boolean} isUpdate - is it update operation or create new
     * @param {UserUpdateOrCreateCallback} callback - user update or create callback
     */
    function validateUserActionCreateNewOrUpdateUser(request, user, isUpdate, callback) {
        var
            name = request.body.name,
            login = request.body.login,
            password = request.body.password,
            role = request.body.role,
            passwordHash = '',
            roles = {};

        if (
            (typeof name === 'undefined') ||
            (typeof login === 'undefined') ||
            (typeof name === 'undefined') ||
            (typeof role === 'undefined')
        ) {
            return callback(null, null, 'Not enough data in the request.');
        }

        name = name.trim();
        login = login.trim();
        password = password.trim();
        role = parseInt(role, 10);

        if (
            (name.length < application.getUserManager().MIN_TEXT_FIELD_LENGTH) ||
            (login.length < application.getUserManager().MIN_TEXT_FIELD_LENGTH)
        ) {
            return callback(
                null,
                null,
                'Name and login should be at least ' + application.getUserManager().MIN_TEXT_FIELD_LENGTH +
                ' characters.'
            );
        }

        if (!isUpdate || (password.length > 0)) {
            if (password.length < application.getUserManager().MIN_TEXT_FIELD_LENGTH) {
                return callback(
                    null,
                    null,
                    'Password should be at least ' + application.getUserManager().MIN_TEXT_FIELD_LENGTH +
                    ' characters.'
                );
            }

            passwordHash = application.getAuth().hashPassword(password);
        } else {
            passwordHash = user.getPasswordHash();
        }

        var userId = (isUpdate === true) ? user.getId() : -1;
        application.getUserManager().getByLogin(login, userId, function (foundUser, error) {
            if (foundUser !== null) {
                return callback(null, null, 'User with login [' + login + '] already exists.');
            }

            if (Number.isNaN(role) && !application.getUserManager().isRoleValid(role)) {
                return callback(null, null, 'New role is invalid.');
            }

            var projects = application.getProjectManager().getAll();

            for (var projectId in projects) {
                var roleInProject = request.body['role_' + projectId];

                if (typeof roleInProject !== 'undefined') {
                    roleInProject = parseInt(roleInProject, 10);

                    if (roleInProject !== -1) {
                        if (!application.getProjectManager().isRoleValid(roleInProject)) {
                            return callback(
                                null,
                                null,
                                'Role for project [' + projects[projectId].getName() + '] is invalid.'
                            );
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

            return callback(user, roles, null);
        });
    };

    /**
     * Update user info
     */
    application.getExpress().post('/admin/users/:userId/', function (request, response) {
        var users = application.getUserManager().getAll();

        if (request.requestedUser === null) {
            return response.render('admin/users.html.twig', {
                action: 'admin.users',
                users: users,
                usersCount: Object.keys(users).length,
                error: 'User with given ID doesn\'t exist'
            });
        }

        validateUserActionCreateNewOrUpdateUser(request, request.requestedUser, true, function (user, roles, error) {
            if (error !== null) {
                return response.render('admin/user.html.twig', {
                    action: 'admin.users',
                    user: user,
                    subaction: 'edit',
                    error: error
                });
            }

            application.getUserManager().update(request.requestedUser, function (error) {
                if (error === null) {
                    application.getProjectManager().setUserRoleInProject(
                        request.requestedUser.getId(),
                        roles,
                        function (error) {
                            if (error === null) {
                                return response.render('admin/user.html.twig', {
                                    action: 'admin.users',
                                    user: request.requestedUser,
                                    subaction: 'edit',
                                    success: 'User info was updated.'
                                });
                            } else {
                                return response.render('admin/user.html.twig', {
                                    action: 'admin.users',
                                    user: request.requestedUser,
                                    subaction: 'edit',
                                    error: 'Got error during update. Contact your system administrator.'
                                });
                            }
                        }
                    );
                } else {
                    return response.render('admin/user.html.twig', {
                        action: 'admin.users',
                        user: request.requestedUser,
                        subaction: 'edit',
                        error: 'Got error during update. Contact your system administrator.'
                    });
                }
            });
        });
    });

    /**
     * View user
     */
    application.getExpress().get('/admin/users/:userId/', function (request, response) {
        if (request.requestedUser === null) {
            var users = application.getUserManager().getAll();

            return response.render('admin/users.html.twig', {
                action: 'admin.users',
                users: users,
                usersCount: Object.keys(users).length,
                error: 'User with given ID doesn\'t exist'
            });
        }

        response.render('admin/user.html.twig', {
            action: 'admin.users',
            user: request.requestedUser,
            caption: 'Edit user #' + request.requestedUser.getId()
        });
    });

    /**
     * View all users
     */
    application.getExpress().get('/admin/users/', function (request, response) {
        var users = application.getUserManager().getAll();

        response.render('admin/users.html.twig', {
            action: 'admin.users',
            users: users,
            usersCount: Object.keys(users).length
        });
    });

    /**
     * View all users with given filters
     */
    application.getExpress().post('/admin/users/', function (request, response) {
        var
            role = request.body.role,
            project = request.body.project,
            projectRole = request.body.project_role;

        role = (typeof role === 'undefined') ? -1 : role;
        project = (typeof project === 'undefined') ? -1 : project;
        projectRole = (typeof projectRole === 'undefined') ? -1 : projectRole;

        var users = {};

        var allUsers = application.getUserManager().getAll();
        for (var index in allUsers) {
            var
                add = true,
                user = allUsers[index];

            if (role != -1) {
                add = (user.getRole() == role);
            }

            if (add) {
                if (project != -1) {
                    add = (application.getProjectManager().getUserRoleInProject(user.getId(), project) != -1);

                    if (add && (projectRole != -1)) {
                        add = (application.getProjectManager().getUserRoleInProject(user.getId(), project) == projectRole);
                    }
                } else if (projectRole != -1) {
                    var
                        found = false,
                        allUserProjects = application.getProjectManager().getAllForUser(user);
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

    /**
     * Delete user - page
     */
    application.getExpress().get('/admin/users/:userId/delete/', function (request, response) {
        if (request.requestedUser === null) {
            var users = application.getUserManager().getAll();

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

    /**
     * Delete user - handler
     */
    application.getExpress().post('/admin/users/:userId/delete/', function (request, response) {
        if (request.requestedUser === null) {
            var users = application.getUserManager().getAll();

            return response.render('admin/users.html.twig', {
                action: 'admin.users',
                users: users,
                usersCount: Object.keys(users).length,
                error: 'User with given ID doesn\'t exist'
            });
        }

        application.getProjectManager().deleteUserFromAllProjects(request.requestedUser.getId(), function (error) {
            var users = application.getUserManager().getAll();

            if (error === null) {
                application.getUserManager().deleteUser(request.requestedUser.getId(), function (error) {
                    if (error === null) {
                        return response.render('admin/users.html.twig', {
                            action: 'admin.users',
                            users: users,
                            usersCount: Object.keys(users).length,
                            success: 'User [' + request.requestedUser.getName() + '] was deleted.'
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
