module.exports.controller = function (app) {
    app.get('/project/:projectId/node', function (request, response) {
        response.render('nodes/index.html.twig', {
            nodes: app.getNodesByProjectId(request.params.projectId)
        });
    })
};
