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
            roles: {},
            user: request.userManager.create(),
            subaction: 'create'
        });
    });

    /**
     * Create a user - handler
     */
    application.getExpress().post('/admin/users/create/', function (request, response) {
        var user = request.userManager.create();

        validateUserActionCreateNewOrUpdateUser(request, user, false, function (user, roles, error) {
            if (error !== null) {
                return response.render('admin/user.html.twig', {
                    action: 'admin.users',
                    user: request.userManager.create(),
                    roles: {},
                    subaction: 'create',
                    error: error
                });
            }

            request.userManager.add(user, function (error) {
                if (error === null) {
                    request.logger.info('new user [' + user.getName() + '] was created.');
                    
                    request.projectManager.setUserRoleInProject(user.getId(), roles, function (error) {
                        if (error === null) {

                            request.logger.info('new user [' + user.getName() + '] roles were created.');

                            return fetchUsersByCriteria(
                                request,
                                response,
                                -1,
                                -1,
                                -1,
                                'User [' + user.getLogin() + '] was created.',
                                null
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
            request.logger.info('user was requested by non-NAN id [' + userId + '], url : ' + request.originalUrl);

            return fetchUsersByCriteria(request, response, -1, -1, -1, null, 'Wrong user id');
        }

        request.userManager.getById(userId, (user, error) => {
            if (user === null) {
                request.logger.info('non-existed user [' + userId + '] was requested, url : ' + request.originalUrl);

                return fetchUsersByCriteria(
                    request, response, -1, -1, -1, null, 'User with given id doesn\'t exist'
                );
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

        if (
            (name.length < request.userManager.MIN_TEXT_FIELD_LENGTH) ||
            (login.length < request.userManager.MIN_TEXT_FIELD_LENGTH)
        ) {
            return callback(
                null,
                null,
                'Name and login should be at least ' + request.userManager.MIN_TEXT_FIELD_LENGTH + ' characters.'
            );
        }

        if (!isUpdate || (password.length > 0)) {
            if (password.length < request.userManager.MIN_TEXT_FIELD_LENGTH) {
                return callback(
                    null,
                    null,
                    'Password should be at least ' + request.userManager.MIN_TEXT_FIELD_LENGTH + ' characters.'
                );
            }

            passwordHash = application.getAuth().hashPassword(password);
        } else {
            passwordHash = user.getPasswordHash();
        }

        var userId = (isUpdate === true) ? user.getId() : -1;
        request.userManager.getByLogin(login, userId, function (foundUser, error) {
            if (foundUser !== null) {
                return callback(null, null, 'User with login [' + login + '] already exists.');
            }

            if (Number.isNaN(role) && !request.userManager.isRoleValid(role)) {
                return callback(null, null, 'New role is invalid.');
            }

            request.projectManager.getAll((projects, error) => {
                for (var projectId in projects) {
                    var roleInProject = request.body['role_' + projectId];

                    if (typeof roleInProject !== 'undefined') {
                        roleInProject = parseInt(roleInProject, 10);

                        if (roleInProject !== -1) {
                            if (!request.projectManager.isRoleValid(roleInProject)) {
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
        request.userManager.getAll((users, error) => {

            var requestedUser = request.requestedUser;

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

                request.userManager.update(requestedUser, function (error) {
                    if (error === null) {
                        request.logger.info('user [' + requestedUser.getName() + '] info was updated.');
                        
                        request.projectManager.setUserRoleInProject(
                            requestedUser.getId(),
                            roles,
                            function (error) {
                                if (error === null) {
                                    request.logger.info('user [' + requestedUser.getName() + '] roles were updated.');
                                    
                                    return fetchUsersByCriteria(
                                        request,
                                        response,
                                        -1,
                                        -1,
                                        -1,
                                        'User [' + user.getLogin() + '] info was updated.',
                                        null
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
        request.projectManager.getUserRoleInProjects(request.requestedUser.getId(), (roles, error) => {
            response.render('admin/user.html.twig', {
                action: 'admin.users',
                user: request.requestedUser,
                roles: roles,
                caption: 'Edit user #' + request.requestedUser.getId()
            });
        });
    });

    /**
     * Search for users with given criteria and renders the template
     *
     * @param {Object} request - expressjs request
     * @param {Object} response - expressjs response
     * @param {number} role - search by role, -1 means any
     * @param {number} projectId - search by project, -1 means any
     * @param {number} projectRole - search by role in project, -1 means any
     * @param {(string|null)} successMessage - success message, if present
     * @param {(string|null)} errorMessage - error message, if present
     */
    function fetchUsersByCriteria(request, response, role, projectId, projectRole, successMessage, errorMessage) {
        request.userManager.searchByCriteria(role, projectId, projectRole, (result, error) => {

            return response.render('admin/users.html.twig', {
                action: 'admin.users',
                users: result.users,
                projects: result.projects,
                usersCount: Object.keys(result.users).length,
                selectedRole: role,
                selectedProject: projectId,
                selectedProjectRole: projectRole,
                success: successMessage,
                error: errorMessage
            });
        });
    }

    /**
     * View all users
     */
    application.getExpress().get('/admin/users/', function (request, response) {
        return fetchUsersByCriteria(request, response, -1, -1, -1, null, null);
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

        return fetchUsersByCriteria(request, response, role, projectId, projectRole, null, null);
    });

    /**
     * Delete user - page
     */
    application.getExpress().get('/admin/users/:userId/delete/', function (request, response) {
        response.render('admin/user.delete.html.twig', {
            action: 'admin.users'
        });
    });

    /**
     * Delete user - handler
     */
    application.getExpress().post('/admin/users/:userId/delete/', function (request, response) {
        request.projectManager.deleteUserFromAllProjects(request.requestedUser.getId(), function (error) {
            request.logger.info('user [' + request.requestedUser.getName() + '] was deleted form all projects.');
            
            if (error === null) {
                request.userManager.deleteUser(request.requestedUser.getId(), function (error) {
                    if (error === null) {
                        request.logger.info('user [' + request.requestedUser.getName() + '] was deleted.');
                        
                        return fetchUsersByCriteria(
                            request,
                            response,
                            -1,
                            -1,
                            -1,
                            'User [' + request.requestedUser.getName() + '] was deleted.',
                            null
                        );
                    } else {
                        return fetchUsersByCriteria(
                            request,
                            response,
                            -1,
                            -1,
                            -1,
                            null,
                            'Got error during delete. Contact your system administrator.'
                        );
                    }
                });
            } else {
                return fetchUsersByCriteria(
                    request,
                    response,
                    -1,
                    -1,
                    -1,
                    null,
                    'Got error during delete. Contact your system administrator.'
                );
            }
        });
    });

};
