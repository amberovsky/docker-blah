"use strict";

/**
 * node._.js - main actions about node
 *
 * /node/:nodeId/
 *
 * (C) Anton Zagorskii aka amberovsky amberovsky@gmail.com
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * Middleware to preload node
     */
    application.getExpress().all('/node/:nodeId/*', function (request, response, next) {
        var nodeId = parseInt(request.params.nodeId);

        if (Number.isNaN(nodeId)) {
            return response.redirect('/');
        }

        request.nodeManager.getById(nodeId, (error, node) => {
            if (node !== null) {
                request.node = node;

                if (request.userManager.isUserUser(request.user) && (request.user.getLocalId() !== node.getProjectId())) {
                    if (!request.projectsWithAccess.hasOwnProperty(node.getProjectId())) {
                        request.logger.error('user [' + request.user.getId() + '] tried to access node [' +
                            node.getId() + '] in project project [' + node.getProjectId() + '] where he doesn\'t ' +
                            'have access.');

                        return response.redirect('/');
                    }

                    request.project = request.projectsWithAccess[node.getProjectId()].project;
                    
                    request.isUserAdminForThisProject =
                        (request.projectsWithAccess[project.getId()].role == request.projectManager.ROLE_ADMIN);

                    return next();
                } else {
                    request.projectManager.getById(node.getProjectId(), (error, project) => {
                        if (error === null) {
                            request.project = project;

                            request.isUserAdminForThisProject = true;
                            return next();

                        } else {
                            request.logger.error('Request to non-existed project [' + node.getProjectId() + '] in ' +
                                'node [' + node.getId() + ']');

                            return response.redirect('/');
                        }
                    });
                }
            } else {
                return response.redirect('/');
            }
        });
    });

    /**
     * Overview
     */
    application.getExpress().get('/node/:nodeId/overview/', function (request, response) {
        request.getDocker().info((error, info) => {
            if (error === null) {
                response.render('project/node/overview.html.twig', {
                    action: 'project.nodes',
                    subaction: 'overview',
                    info: info
                });
            } else {
                request.logger.error(error);

                response.render('project/node/overview.html.twig', {
                    action: 'project.nodes',
                    subaction: 'overview',
                    error: error
                });
            }
        })
    });

    /**
     * Containers
     */
    application.getExpress().get('/node/:nodeId/containers/', function (request, response) {
        response.render('project/node/containers.html.twig', {
            action: 'project.nodes',
            subaction: 'containers'
        });
    });

    /**
     * Images
     */
    application.getExpress().get('/node/:nodeId/images/', function (request, response) {
        response.render('project/node/images.html.twig', {
            action: 'project.nodes',
            subaction: 'images'
        });
    });

};
