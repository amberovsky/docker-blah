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

    var
        userManager = application.getUserManager(),
        projectManager = application.getProjectManager();
    
    /**
     * Create a user - page
     */
    application.getExpress().get('/admin/users/create/', function (request, response) {
        response.render('admin/user.html.twig', {
            action: 'admin.users',
            roles: {},
            user: userManager.create(),
            subaction: 'create'
        });
    });

    /**
     * Create a user - handler
     */
    application.getExpress().post('/admin/users/create/', function (request, response) {
        var user = userManager.create();

        validateUserActionCreateNewOrUpdateUser(request, user, false, function (user, roles, error) {
            if (error !== null) {
                return response.render('admin/user.html.twig', {
                    action: 'admin.users',
                    user: userManager.create(),
                    roles: {},
                    subaction: 'create',
                    error: error
                });
            }

            userManager.add(user, function (error) {
                if (error === null) {
                    projectManager.setUserRoleInProject(user.getId(), roles, function (error) {
                        if (error === null) {
                            return fetchUsersByCriteria(
                                response,
                                -1,
                                -1,
                                -1,
                                'User [' + user.getLogin() + '] was created.'
                            );
                        } else {
                            return response.render('admin/user.html.twig', {
                                action: 'admin.users',
                                user: user,
                                roles: {},
                                subaction: 'create',
                                error: 'Got error during create. Contact your system administrator.'
                            });
                        }
                    });
                } else {
                    return response.render('admin/user.html.twig', {
                        action: 'admin.users',
                        user: user,
                        roles: {},
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

        if (Number.isNaN(userId)) {
            return response.redirect('/');
        }

        userManager.getById(userId, (user, error) => {
            if (user === null) {
                return response.redirect('/');
            }
            
            request.requestedUser = user;
            return next();
        });
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

        if ((name.length < userManager.MIN_TEXT_FIELD_LENGTH) || (login.length < userManager.MIN_TEXT_FIELD_LENGTH)) {
            return callback(
                null,
                null,
                'Name and login should be at least ' + userManager.MIN_TEXT_FIELD_LENGTH + ' characters.'
            );
        }

        if (!isUpdate || (password.length > 0)) {
            if (password.length < userManager.MIN_TEXT_FIELD_LENGTH) {
                return callback(
                    null,
                    null,
                    'Password should be at least ' + userManager.MIN_TEXT_FIELD_LENGTH + ' characters.'
                );
            }

            passwordHash = application.getAuth().hashPassword(password);
        } else {
            passwordHash = user.getPasswordHash();
        }

        var userId = (isUpdate === true) ? user.getId() : -1;
        userManager.getByLogin(login, userId, function (foundUser, error) {
            if (foundUser !== null) {
                return callback(null, null, 'User with login [' + login + '] already exists.');
            }

            if (Number.isNaN(role) && !userManager.isRoleValid(role)) {
                return callback(null, null, 'New role is invalid.');
            }

            projectManager.getAll((projects, error) => {
                for (var projectId in projects) {
                    var roleInProject = request.body['role_' + projectId];

                    if (typeof roleInProject !== 'undefined') {
                        roleInProject = parseInt(roleInProject, 10);

                        if (roleInProject !== -1) {
                            if (!projectManager.isRoleValid(roleInProject)) {
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
        });
    };

    /**
     * Update user info
     */
    application.getExpress().post('/admin/users/:userId/', function (request, response) {
        userManager.getAll((users, error) => {

            var requestedUser = request.requestedUser;

            if (requestedUser === null) {
                return response.render('admin/users.html.twig', {
                    action: 'admin.users',
                    users: users,
                    usersCount: Object.keys(users).length,
                    error: 'User with given ID doesn\'t exist'
                });
            }

            validateUserActionCreateNewOrUpdateUser(request, requestedUser, true, function (user, roles, error) {
                if (error !== null) {
                    return response.render('admin/user.html.twig', {
                        action: 'admin.users',
                        user: user,
                        roles: roles,
                        subaction: 'edit',
                        error: error
                    });
                }

                userManager.update(requestedUser, function (error) {
                    if (error === null) {
                        projectManager.setUserRoleInProject(
                            requestedUser.getId(),
                            roles,
                            function (error) {
                                if (error === null) {
                                    return fetchUsersByCriteria(
                                        response,
                                        -1,
                                        -1,
                                        -1,
                                        'User [' + user.getLogin() + '] info was updated.'
                                    );
                                } else {
                                    return response.render('admin/user.html.twig', {
                                        action: 'admin.users',
                                        user: requestedUser,
                                        roles: roles,
                                        subaction: 'edit',
                                        error: 'Got error during update. Contact your system administrator.'
                                    });
                                }
                            }
                        );
                    } else {
                        return response.render('admin/user.html.twig', {
                            action: 'admin.users',
                            user: requestedUser,
                            roles: roles,
                            subaction: 'edit',
                            error: 'Got error during update. Contact your system administrator.'
                        });
                    }
                });
            });
        });
    });

    /**
     * View user
     */
    application.getExpress().get('/admin/users/:userId/', function (request, response) {
        if (request.requestedUser === null) {
            userManager.getAll((users, error) => {
                return response.render('admin/users.html.twig', {
                    action: 'admin.users',
                    users: users,
                    usersCount: Object.keys(users).length,
                    error: 'User with given ID doesn\'t exist'
                });
            });
        }

        projectManager.getUserRoleInProjects(request.requestedUser.getId(), (roles, error) => {
            response.render('admin/user.html.twig', {
                action: 'admin.users',
                user: request.requestedUser,
                roles: roles,
                caption: 'Edit user #' + request.requestedUser.getId()
            });
        });
    });

    function fetchUsersByCriteria(response, role, projectId, projectRole, successMessage) {
        userManager.searchByCriteria(role, projectId, projectRole, (result, error) => {

            response.render('admin/users.html.twig', {
                action: 'admin.users',
                users: result.users,
                projects: result.projects,
                usersCount: Object.keys(result.users).length,
                selectedRole: role,
                selectedProject: projectId,
                selectedProjectRole: projectRole,
                success: successMessage
            });
        });
    }

    /**
     * View all users
     */
    application.getExpress().get('/admin/users/', function (request, response) {
        return fetchUsersByCriteria(response, -1, -1, -1);
    });

    /**
     * View all users with given filters
     */
    application.getExpress().post('/admin/users/', function (request, response) {
        var
            role = request.body.role,
            projectId = request.body.project,
            projectRole = request.body.project_role;

        role = parseInt((typeof role === 'undefined') ? -1 : role, 10);
        projectId = parseInt((typeof projectId === 'undefined') ? -1 : projectId, 10);
        projectRole = parseInt((typeof projectRole === 'undefined') ? -1 : projectRole, 10);

        role = Number.isNaN(role) ? -1 : role;
        projectId = Number.isNaN(projectId) ? -1 : projectId;
        projectRole = Number.isNaN(projectRole) ? -1 : projectRole;

        return fetchUsersByCriteria(response, role, projectId, projectRole);
    });

    /**
     * Delete user - page
     */
    application.getExpress().get('/admin/users/:userId/delete/', function (request, response) {
        if (request.requestedUser === null) {
            userManager.getAll((users, error) => {
                return response.render('admin/users.html.twig', {
                    action: 'admin.users',
                    users: users,
                    usersCount: Object.keys(users).length,
                    error: 'User with given ID doesn\'t exist'
                });
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
            userManager.getAll((users, error) => {
                return response.render('admin/users.html.twig', {
                    action: 'admin.users',
                    users: users,
                    usersCount: Object.keys(users).length,
                    error: 'User with given ID doesn\'t exist'
                });
            });
        }

        projectManager.deleteUserFromAllProjects(request.requestedUser.getId(), function (error) {
            if (error === null) {
                userManager.deleteUser(request.requestedUser.getId(), function (error) {
                    userManager.getAll((users, errorForAll) => {
                        if (error === null) {
                            return fetchUsersByCriteria(
                                response,
                                -1,
                                -1,
                                -1,
                                'User [' + request.requestedUser.getName() + '] was deleted.'
                            );
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
            } else {
                userManager.getAll((users, errorForAll) => {
                    return response.render('admin/users.html.twig', {
                        action: 'admin.users',
                        users: users,
                        usersCount: Object.keys(users).length,
                        error: 'Got error during delete. Contact your system administrator.'
                    });
                });
            }
        });
    });

};
