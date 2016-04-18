module.exports.controller = function (app) {

    app.all('/admin/projects/:projectId/*', function (request, response, next) {
        request.projectId = parseInt(request.params.projectId);
        request.project = Number.isNaN(request.projectId)
            ? null
            : app.docker_blah.projectManager.getById(request.projectId);

        next();
    });

    app.get('/admin/projects/', function (request, response) {
        response.render('admin/projects.html.twig', {
            action: 'admin.projects',
            projects: app.docker_blah.projectManager.getAll()
        });
    });

    app.get('/admin/projects/create/', function (request, response) {
        response.render('admin/project.html.twig', {
            action: 'admin.projects',
            project: app.docker_blah.projectManager.create(),
            subaction: 'create'
        });
    });

    app.post('/admin/projects/create/', function (request, response) {
        var
            project = app.docker_blah.projectManager.create(),
            validation = validateProjectActionCreateNewOrUpdateProject(request, project, false);

        if (validation !== true) {
            return response.render('admin/project.html.twig', {
                action: 'admin.projects',
                project: project,
                error: validation,
                subaction: 'create'
            });
        }

        app.docker_blah.projectManager.add(project, function (error) {
            if (error) {
                response.render('admin/project.html.twig', {
                    action: 'admin.projects',
                    project: project,
                    error: 'Got error during create. Contact your system administrator.',
                    subaction: 'create'
                });
            } else {
                response.render('admin/project.html.twig', {
                    action: 'admin.projects',
                    project: project,
                    subaction: 'create',
                    success: 'Project [' + project.getName() + '] was created.'
                });
            }
        });
    });

    app.get('/admin/projects/:projectId/', function (request, response) {
        if (request.project === null) {
            return response.render('admin/projects.html.twig', {
                action: 'admin.projects',
                projects: app.docker_blah.projectManager.getAll(),
                error: 'Project with given ID doesn\'t exist'
            });
        }

        response.render('admin/project.html.twig', {
            action: 'admin.projects',
            project: request.project
        });
    });

    function validateProjectActionCreateNewOrUpdateProject(request, project, isUpdate) {
        var name = request.body.name;

        if (typeof name === 'undefined') {
            return 'Not enough data in the request.';
        }

        name = name.trim();

        if (name.length < app.docker_blah.projectManager.MIN_TEXT_FIELD_LENGTH) {
            return 'Name should be at least ' + app.docker_blah.projectManager.MIN_TEXT_FIELD_LENGTH +
                ' characters.';
        }

        if (app.docker_blah.projectManager.getByName(name, (isUpdate === true) ? project.getId() : -1) !== null) {
            return 'Project with name [' + name + '] already exists.';
        }

        project.setName(name);

        return true;
    }

    app.post('/admin/projects/:projectId/', function (request, response) {
        if (request.project === null) {
            return response.render('admin/projects.html.twig', {
                action: 'admin.projects',
                projects: app.docker_blah.projectManager.getAll(),
                error: 'Project with given ID doesn\'t exist'
            });
        }

        var validation = validateProjectActionCreateNewOrUpdateProject(request, request.project, true);

        if (validation !== true) {
            return response.render('admin/project.html.twig', {
                action: 'admin.projects',
                project: app.docker_blah.projectManager.getAll(),
                subaction: 'edit',
                error: validation
            });
        }

        app.docker_blah.projectManager.update(request.project, function (error) {
            if (!error) {
                return response.render('admin/project.html.twig', {
                    action: 'admin.projects',
                    project: request.project,
                    subaction: 'edit',
                    success: 'Project [' + request.project.getName() + '] info was updated.'
                });
            } else {
                return response.render('admin/project.html.twig', {
                    action: 'admin.projects',
                    project: request.project,
                    subaction: 'edit',
                    error: 'Got error during update. Contact your system administrator.'
                });
            }
        });
    });
    
};
