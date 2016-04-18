module.exports.controller = function(app) {

    app.all('/admin/users/:userId/*', function(request, response, next) {
        request.userId = parseInt(request.params.userId);
        request.user = Number.isNaN(request.userId)
            ? null
            : app.docker_blah.userManager.getById(request.userId);

        next();
    });

    app.get('/admin/users/create/', function (request, response) {
        response.render('admin/user.html.twig', {
            action: 'admin.users',
            user: app.docker_blah.userManager.create(),
            subaction: 'create'
        });
    });

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
            (name.length < app.docker_blah.userManager.MIN_TEXT_FIELD_LENGTH) ||
            (login.length < app.docker_blah.userManager.MIN_TEXT_FIELD_LENGTH)
        ) {
            return 'Name and login should be at least ' + app.docker_blah.userManager.MIN_TEXT_FIELD_LENGTH +
                ' characters.';
        }

        if (!isUpdate || (password.length > 0)) {
            if (password.length < app.docker_blah.userManager.MIN_TEXT_FIELD_LENGTH) {
                return 'Password should be at least ' + app.docker_blah.userManager.MIN_TEXT_FIELD_LENGTH +
                    ' characters.';
            }

            passwordHash = app.docker_blah.authManager.hashPassword(password);
        } else {
            passwordHash = user.getPasswordHash();
        }

        if (app.docker_blah.userManager.getByLogin(login, (isUpdate === true) ? user.getId() : -1) !== null) {
            return 'User with login [' + login + '] already exists.';
        }

        if (Number.isNaN(role) && !app.docker_blah.userManager.isRoleValid(role)) {
            return 'New role is invalid.';
        }

        var projects = app.docker_blah.projectManager.getAll();

        for (var projectId in projects) {
            var roleInProject = request.body['role_' + projectId];

            if (typeof roleInProject !== 'undefined') {
                roleInProject = parseInt(roleInProject, 10);

                if (roleInProject !== -1) {
                    if (!app.docker_blah.projectManager.isRoleValid(roleInProject)) {
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

    app.post('/admin/users/create/', function (request, response) {
        var
            roles = {},
            user = app.docker_blah.userManager.create(),
            validation = validateUserActionCreateNewOrUpdateUser(request, user, roles, false);

        if (validation !== true) {
            return response.render('admin/user.html.twig', {
                action: 'admin.users',
                user: app.docker_blah.userManager.create(),
                subaction: 'create',
                error: validation
            });
        }

        app.docker_blah.userManager.add(user, function(error) {
            if (!error) {
                app.docker_blah.projectManager.setUserRoleInProject(user.getId(), roles, function (error) {
                    if (!error) {
                        return response.render('admin/user.html.twig', {
                            action: 'admin.users',
                            user: app.docker_blah.userManager.create(),
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

    app.post('/admin/users/:userId/', function (request, response) {
        if (request.user === null) {
            return response.render('admin/users.html.twig', {
                action: 'admin.users',
                users: app.docker_blah.userManager.getAll(),
                error: 'User with given ID doesn\'t exist'
            });
        }

        var
            roles = {},
            validation = validateUserActionCreateNewOrUpdateUser(request, request.user, roles, true);

        if (validation !== true) {
            return response.render('admin/user.html.twig', {
                action: 'admin.users',
                users: app.docker_blah.userManager.getAll(),
                subaction: 'edit',
                error: validation
            });
        }

        app.docker_blah.userManager.update(request.user, function(error) {
            if (!error) {
                app.docker_blah.projectManager.setUserRoleInProject(request.user.getId(), roles, function(error) {
                    if (!error) {
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

    app.get('/admin/users/:userId/', function (request, response) {
        if (request.user === null) {
            return response.render('admin/users.html.twig', {
                action: 'admin.users',
                users: app.docker_blah.userManager.getAll(),
                error: 'User with given ID doesn\'t exist'
            });
        }

        response.render('admin/user.html.twig', {
            action: 'admin.users',
            user: request.user,
            caption: 'Edit user #' + request.user.getId()
        });
    });

    app.get('/admin/users/', function (request, response) {
        response.render('admin/users.html.twig', {
            action: 'admin.users',
            users: app.docker_blah.userManager.getAll()
        });
    });

    app.post('/admin/users/', function (request, response) {
        var
            role = request.body.role,
            project = request.body.project,
            projectRole = request.body.project_role;

        role = (typeof role === 'undefined') ? -1 : role;
        project = (typeof project === 'undefined') ? -1 : project;
        projectRole = (typeof projectRole === 'undefined') ? -1 : projectRole;

        var users = {};

        var allUsers = app.docker_blah.userManager.getAll();
        for (var index in allUsers) {
            var
                add = true,
                user = allUsers[index];

            if (role != -1) {
                add = (user.getRole() == role);
            }

            if (add) {
                if (project != -1) {
                    add = (app.docker_blah.projectManager.getUserRoleInProject(user.getId(), project) != -1);

                    if (add && (projectRole != -1)) {
                        add = (app.docker_blah.projectManager.getUserRoleInProject(user.getId(), project) == projectRole);
                    }
                } else if (projectRole != -1) {
                    var
                        found = false,
                        allUserProjects = app.docker_blah.projectManager.getAllForUser(user);
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
            selectedRole: role,
            selectedProject: project,
            selectedProjectRole: projectRole
        });
    });

    app.get('/admin/users/:userId/delete/', function (request, response) {
        if (request.user === null) {
            return response.render('admin/users.html.twig', {
                action: 'admin.users',
                users: app.docker_blah.userManager.getAll(),
                error: 'User with given ID doesn\'t exist'
            });
        }

        response.render('admin/user.delete.html.twig', {
            action: 'admin.users'
        });
    });

    app.post('/admin/users/:userId/delete/', function (request, response) {
        if (request.user === null) {
            return response.render('admin/users.html.twig', {
                action: 'admin.users',
                users: app.docker_blah.userManager.getAll(),
                error: 'User with given ID doesn\'t exist'
            });
        }

        app.docker_blah.projectManager.deleteUserFromAllProjects(request.user.getId(), function(error) {
            if (!error) {
                app.docker_blah.userManager.deleteUser(request.user.getId(), function(error) {
                    if (!error) {
                        return response.render('admin/users.html.twig', {
                            action: 'admin.users',
                            users: app.docker_blah.userManager.getAll(),
                            success: 'User [' + request.user.getName() + '] was deleted.'
                        });
                    } else {
                        return response.render('admin/users.html.twig', {
                            action: 'admin.users',
                            users: app.docker_blah.userManager.getAll(),
                            error: 'Got error during delete. Contact your system administrator.'
                        });
                    }
                });
            } else {
                return response.render('admin/users.html.twig', {
                    action: 'admin.users',
                    users: app.docker_blah.userManager.getAll(),
                    error: 'Got error during delete. Contact your system administrator.'
                });
            }
        });
    });

};
