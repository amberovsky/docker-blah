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
        request.requestedUser = request.userManager.create();
        
        response.render('admin/user/user.html.twig', {
            action: 'admin.users',
            roles: {},
            subaction: 'create'
        });
    });

    /**
     * Create a user - handler
     */
    application.getExpress().post('/admin/users/create/', function (request, response) {
        request.requestedUser = request.userManager.create();

        validateUserActionCreateNewOrUpdateUser(request, false, function (error, roles) {
            if (error !== null) {
                return response.render('admin/user/user.html.twig', {
                    action: 'admin.users',
                    roles: roles,
                    subaction: 'create',
                    error: error
                });
            }

            request.userManager.add(request.requestedUser, function (error) {
                if (error === null) {
                    request.logger.info('new user [' + request.requestedUser.getName() + '] was created.');
                    
                    request.projectManager.setUserRoleInProject(request.requestedUser.getId(), roles, function (error) {
                        if (error === null) {

                            request.logger.info(
                                'new user [' + request.requestedUser.getName() + '] roles were created.'
                            );

                            return fetchUsersByCriteria(
                                request,
                                response,
                                -1,
                                -1,
                                -1,
                                'User [' + request.requestedUser.getLogin() + '] was created.',
                                null
                            );
                        } else {
                            return response.render('admin/user/user.html.twig', {
                                action: 'admin.users',
                                roles: roles,
                                subaction: 'create',
                                error: 'Got error during create. Contact your system administrator.'
                            });
                        }
                    });
                } else {
                    return response.render('admin/user/user.html.twig', {
                        action: 'admin.users',
                        roles: roles,
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
            request.logger.info('user was requested by non-NAN id [' + userId + ']');

            return fetchUsersByCriteria(request, response, -1, -1, -1, null, 'Wrong user id');
        }

        request.userManager.getById(userId, (error, user) => {
            if (user === null) {
                request.logger.info('non-existed user [' + userId + '] was requested');

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
     * @param {(null|string)} error - error message, if error happened
     * @param {(null|object)} roles - will be populated new with new roles in each project for given user,
     *                                  projectId x role, null if error happened
     */

    /**
     * Validate request for create new user or update existing
     *
     * @param {Object} request - express request
     * @param {boolean} isUpdate - is it update operation or create new
     * @param {UserUpdateOrCreateCallback} callback - user update or create callback
     */
    function validateUserActionCreateNewOrUpdateUser(request, isUpdate, callback) {
        var
            name = request.body.name,
            login = request.body.login,
            password = request.body.password,
            role = request.body.role,
            passwordHash = '',
            roles = {};
        
        request.requestedUser
            .setName(name)
            .setLogin(login)
            .setRole(role);

        if (
            (typeof name === 'undefined') ||
            (typeof login === 'undefined') ||
            (typeof name === 'undefined') ||
            (typeof role === 'undefined')
        ) {
            return callback('Not enough data in the request.', null);
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
                'Name and login should be at least ' + request.userManager.MIN_TEXT_FIELD_LENGTH + ' characters.',
                null
            );
        }

        if (!isUpdate || (password.length > 0)) {
            if (password.length < request.userManager.MIN_TEXT_FIELD_LENGTH) {
                return callback(
                    'Password should be at least ' + request.userManager.MIN_TEXT_FIELD_LENGTH + ' characters.',
                    null
                );
            }

            passwordHash = application.getAuth().hashPassword(password);
        } else {
            passwordHash = request.requestedUser.getPasswordHash();
        }

        var userId = (isUpdate === true) ? request.requestedUser.getId() : -1;
        request.userManager.getByLogin(login, userId, function (error, foundUser) {
            if (foundUser !== null) {
                return callback('User with login [' + login + '] already exists.', null);
            }

            if (Number.isNaN(role) && !request.userManager.isRoleValid(role)) {
                return callback('New role is invalid.', null);
            }

            request.projectManager.getAllExceptLocal((error, projects) => {
                for (var projectId in projects) {
                    var roleInProject = request.body['role_' + projectId];

                    if (typeof roleInProject !== 'undefined') {
                        roleInProject = parseInt(roleInProject, 10);

                        if (roleInProject !== -1) {
                            if (!request.projectManager.isRoleValid(roleInProject)) {
                                return callback(
                                    'Role for project [' + projects[projectId].getName() + '] is invalid.',
                                    null
                                );
                            }

                            roles[projectId] = roleInProject;
                        }
                    }
                }

                request.requestedUser
                    .setName(name)
                    .setLogin(login)
                    .setRole(role)
                    .setPasswordHash(passwordHash);

                return callback(null, roles);

            });
        });
    };

    /**
     * Update user info
     */
    application.getExpress().post('/admin/users/:userId/', function (request, response) {
        request.userManager.getAll((error, users) => {
            validateUserActionCreateNewOrUpdateUser(request, true, function (error, roles) {
                if (error !== null) {
                    return response.render('admin/user/user.html.twig', {
                        action: 'admin.users',
                        roles: roles,
                        subaction: 'edit',
                        error: error
                    });
                }

                request.userManager.update(request.requestedUser, function (error) {
                    if (error === null) {
                        request.logger.info('user [' + request.requestedUser.getName() + '] info was updated.');
                        
                        request.projectManager.setUserRoleInProject(
                            request.requestedUser.getId(),
                            roles,
                            function (error) {
                                if (error === null) {
                                    request.logger.info(
                                        'user [' + request.requestedUser.getName() + '] roles were updated.'
                                    );
                                    
                                    return fetchUsersByCriteria(
                                        request,
                                        response,
                                        -1,
                                        -1,
                                        -1,
                                        'User [' + request.requestedUser.getLogin() + '] info was updated.',
                                        null
                                    );
                                } else {
                                    return response.render('admin/user/user.html.twig', {
                                        action: 'admin.users',
                                        roles: roles,
                                        subaction: 'edit',
                                        error: 'Got error during update. Contact your system administrator.'
                                    });
                                }
                            }
                        );
                    } else {
                        return response.render('admin/user/user.html.twig', {
                            action: 'admin.users',
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
     * View/Edit user
     */
    application.getExpress().get('/admin/users/:userId/', function (request, response) {
        request.projectManager.getUserRoleInProjects(request.requestedUser.getId(), (error, roles) => {
            response.render('admin/user/user.html.twig', {
                action: 'admin.users',
                roles: roles
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
        request.userManager.searchByCriteria(role, projectId, projectRole, (error, result) => {

            return response.render('admin/user/users.html.twig', {
                action: 'admin.users',
                users: result.users,
                projects: result.projects,
                roles: result.roles,
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
        response.render('admin/user/delete.html.twig', {
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
