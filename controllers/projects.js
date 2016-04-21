"use strict";

/**
 * projects.js - project section
 *
 * /project/*
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {
    
    var dockerBlah = application.getDockerBlah();

    application.getExpress().all('/project/:projectId/*', function(request, response, next) {
        request.project = dockerBlah.getProjectManager().getById(request.params.projectId);

        next();
    });

    application.getExpress().get('/project/:projectId/', function (request, response) {
        response.render('projects/index.html.twig', {
            action: 'projects.index'
        });
    });

    application.getExpress().get('/project/:projectId/nodes/', function (request, response) {
        response.render('projects/nodes.html.twig', {
            action: 'projects.nodes',
            nodes: dockerBlah.getNodeManager().filterByProjectId(request.project.getId())
        });
    });

    application.getExpress().get('/project/:projectId/containers/', function (request, response) {
        response.render('projects/containers.html.twig', {
            action: 'projects.containers'
        });
    });

    application.getExpress().get('/project/:projectId/settings/', function (request, response) {
        response.render('projects/settings.html.twig', {
            action: 'projects.settings'
        });
    });
    
};
