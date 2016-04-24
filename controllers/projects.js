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

    /**
     * Middleware to preload project if there is a projectId in the url
     */
    application.getExpress().all('/project/:projectId/*', function(request, response, next) {
        request.projectId = parseInt(request.params.projectId);
        request.project = Number.isNaN(request.projectId)
            ? null
            : dockerBlah.getProjectManager().getById(request.projectId);

        next();
    });

    /**
     * Project overview
     */
    application.getExpress().get('/project/:projectId/', function (request, response) {
        response.render('projects/index.html.twig', {
            action: 'project.index'
        });
    });

    /**
     * View nodes in project
     */
    application.getExpress().get('/project/:projectId/nodes/', function (request, response) {
        response.render('projects/nodes.html.twig', {
            action: 'project.nodes',
            nodes: dockerBlah.getNodeManager().filterByProjectId(request.project.getId())
        });
    });

    /**
     * View containers in project
     */
    application.getExpress().get('/project/:projectId/containers/', function (request, response) {
        response.render('projects/containers.html.twig', {
            action: 'project.containers'
        });
    });

    /**
     * View project settings
     */
    application.getExpress().get('/project/:projectId/settings/', function (request, response) {
        response.render('projects/settings.html.twig', {
            action: 'project.settings'
        });
    });
    
};
