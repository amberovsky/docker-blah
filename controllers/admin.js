module.exports.controller = function (app) {
    app.get('/admin/projects', function (request, response) {
        response.render('admin/projects.html.twig', {
            action: 'admin.projects'
        });
    });

    app.get('/admin/events', function (request, response) {
        response.render('admin/events.html.twig', {
            action: 'admin.events'
        });
    });

    app.get('/admin/settings', function (request, response) {
        response.render('admin/settings.html.twig', {
            action: 'admin.settings'
        });
    });

    function validateUserActionPersonalUpdate(request, user) {
        var
            name = request.body.name,
            login = request.body.login,
            password = request.body.password,
            role = request.body.role;

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
            (login.length < app.docker_blah.userManager.MIN_TEXT_FIELD_LENGTH) ||
            (password.length < app.docker_blah.userManager.MIN_TEXT_FIELD_LENGTH)
        ) {
            return 'Name and login should be at least ' + app.docker_blah.userManager.MIN_TEXT_FIELD_LENGTH +
                ' characters.';
        }

        if (!app.docker_blah.userManager.isRoleValid(role)) {
            return 'New role is invalid';
        }

        user
            .setName(name)
            .setLogin(login)
            .setRole(role);

        return true;
    }

    app.get('/admin/users/create', function (request, response) {
        response.render('admin/user.html.twig', {
            action: 'admin.users',
            user: app.docker_blah.userManager.createNewUser(),
            subaction: 'create'
        });
    });

    function validateCreateNewUserAction(request, user, roles) {
        var
            name = request.body.name,
            login = request.body.login,
            password = request.body.password,
            role = request.body.role;

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
            (login.length < app.docker_blah.userManager.MIN_TEXT_FIELD_LENGTH) ||
            (password.length < app.docker_blah.userManager.MIN_TEXT_FIELD_LENGTH)
        ) {
            return 'Name and login and password should be at least ' +
                app.docker_blah.userManager.MIN_TEXT_FIELD_LENGTH + ' characters.';
        }

        if (app.docker_blah.userManager.getByLogin(login) !== null) {
            return 'User with login [' + login + '] already exists.';
        }

        if (!app.docker_blah.userManager.isRoleValid(role)) {
            return 'New role is invalid.';
        }
        
        var projects = app.docker_blah.projectManager.getAll();
        
        for (var projectId in projects) {
            var roleInProject = request.body['role_' + projectId];
            
            if (typeof roleInProject !== 'undefined') {
                roleInProject = parseInt(roleInProject, 10);

                if (roleInProject !== -1) {
                    if (!app.docker_blah.projectManager.isRoleValid(roleInProject)) {
                        return 'Role for project [' + 1 + '] is invalid.';
                    }

                    roles[projectId] = roleInProject;
                }
            }
        }

        user
            .setName(name)
            .setLogin(login)
            .setRole(role)
            .setPasswordHash(app.docker_blah.authManager.hashPassword(password));

        return true;
    };

    app.post('/admin/users/create', function (request, response) {
        var
            roles = {},
            user = app.docker_blah.userManager.createNewUser(),
            validation = validateCreateNewUserAction(request, user, roles);

        if (validation !== true) {
            return response.render('admin/user.html.twig', {
                action: 'admin.users',
                user: app.docker_blah.userManager.createNewUser(),
                subaction: 'create',
                error: validation
            });
        } else {
            this.app.docker_blah.userManager.addNewUser(user, function(error, result) {
                
                return response.render('admin/user.html.twig', {
                    action: 'admin.users',
                    user: app.docker_blah.userManager.createNewUser(),
                    subaction: 'create',
                    success: 'done'
                });
            });
        }
    });

    app.post('/admin/users/:userId', function (request, response) {
        var
            action = request.body.action,
            user = app.docker_blah.userManager.getById(request.params.userId);

        if (typeof action === 'undefined') {
            return response.render('admin/user.html.twig', {
                action: 'admin.users',
                user: user,
                error_personal: 'Wrong request.',
                subaction: 'edit'
            });
        }

        if (action === 'personal') {

        } else if (action === 'projects') {

        } else {
            return response.render('admin/user.html.twig', {
                action: 'admin.users',
                user: user,
                error_personal: 'Wrong request.',
                subaction: 'edit'
            });
        }

        response.render('admin/user.html.twig', {
            action: 'admin.users',
            user: user,
            subaction: 'edit'
        });
    });


    app.get('/admin/users/:userId', function (request, response) {
        var user = app.docker_blah.userManager.getById(request.params.userId);

        response.render('admin/user.html.twig', {
            action: 'admin.users',
            user: user,
            caption: 'Edit user #' + user.getId()
        });
    });

    app.get('/admin/users', function (request, response) {
        response.render('admin/users.html.twig', {
            action: 'admin.users',
            users: app.docker_blah.userManager.getAll()
        });
    });

    app.post('/admin/users', function (request, response) {
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

};
