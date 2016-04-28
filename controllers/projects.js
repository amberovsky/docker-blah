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

    var projectManager = application.getProjectManager();
    
    /**
     * Middleware to preload project if there is a projectId in the url
     */
    application.getExpress().all('/project/:projectId/*', function (request, response, next) {
        var projectId = parseInt(request.params.projectId);
        
        if (Number.isNaN(projectId)) {
            return response.redirect('/');
        }

        projectManager.getById(projectId, (project, error) => {
            if (project !== null) {
                request.project = project;

                projectManager.getUserRoleInProjects(request.user.getId(), (roles) => {
                    if (!roles.hasOwnProperty(project.getId())) {
                        return response.redirect('/');
                    }

                    request.isUserAdminForThisProject = (roles[project.getId()] == projectManager.ROLE_ADMIN);

                    return next();
                });
            } else {
                return response.redirect('/');
            }
        });
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
        application.getNodeManager().filterByProjectId(request.project.getId(), (nodes, error) => {
            response.render('projects/nodes.html.twig', {
                action: 'project.nodes',
                nodes: nodes
            });
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
        if (!request.isUserAdminForThisProject) {
            return response.redirect('/');
        }
        
        response.render('projects/settings.html.twig', {
            action: 'project.settings'
        });
    });

};
