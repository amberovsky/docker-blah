module.exports.controller = function (app) {

    app.all('/project/:projectId/*', function(request, response, next) {
        request.docker_blah.project = app.docker_blah.projectManager.getById(request.params.projectId);

        next();
    });

    app.get('/project/:projectId', function (request, response) {
        response.render('projects/index.html.twig', {
            action: 'projects.index'
        });
    });

    app.get('/project/:projectId/nodes', function (request, response) {
        response.render('projects/nodes.html.twig', {
            action: 'projects.nodes',
            nodes: app.docker_blah.nodeManager.filterByProjectId(request.docker_blah.project.getId())
        });
    });

    app.get('/project/:projectId/containers', function (request, response) {
        response.render('projects/containers.html.twig', {
            action: 'projects.containers'
        });
    });

    app.get('/project/:projectId/settings', function (request, response) {
        response.render('projects/settings.html.twig', {
            action: 'projects.settings'
        });
    });
};
