"use strict";

/**
 * node.js - all about a node: containers, images, etc
 *
 * /node/:nodeId/
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    var Docker = require('dockerode');

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

                if (request.userManager.isUserUser(request.user)) {
                    if (!request.projectsWithAccess.hasOwnProperty(node.getProjectId())) {
                        request.logger.error('user [' + request.user.getId() + '] tried to access node [' +
                            node.getId() + '] in project project [' + project.getId() + '] where he doesn\'t have ' +
                            'access.');

                        return response.redirect('/');
                    }

                    request.project = request.projectsWithAccess[node.getProjectId()];
                    
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
     * @param {Object} request - expressjs request
     * @returns {Object} Docker
     */
    function getDocker(request) {
        return new Docker({
            host: request.node.getIp(),
            protocol: 'https',
            ca: request.project.getCA(),
            cert: request.project.getCERT(),
            key: request.project.getKEY(),
            port: request.node.getPort()
        });
    }

    /**
     * Overview
     */
    application.getExpress().get('/node/:nodeId/overview/', function (request, response) {
        response.render('project/node/overview.html.twig', {
            action: 'project.nodes',
            subaction: 'overview'
        });
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
     * Containers - list
     */
    application.getExpress().get('/node/:nodeId/containers/list/', function (request, response) {
        getDocker(request).listContainers((error, containers) => {
            if (error === null) {
                response.render('project/node/containers.list.html.twig', {
                    containers: containers
                });
            } else {
                response.render('project/node/containers.list.html.twig', {
                    containers: {},
                    error: error
                });
            }
        });
    });

    /**
     * Container - overview
     */
    application.getExpress().get('/node/:nodeId/containers/:containerId/overview/', function (request, response) {
        var container = getDocker(request).getContainer(request.params.containerId);

        container.inspect((error, containerInfo) => {
            if (error === null) {
                container.top((error, top) => {
                    if (error === null) {
                        response.render('project/node/container/overview.html.twig', {
                            action: 'project.nodes',
                            subaction: 'overview',
                            container: containerInfo
                        });
                    } else {
                        response.render('project/node/container/overview.html.twig', {
                            action: 'project.nodes',
                            subaction: 'overview',
                            container: {},
                            error: error
                        });
                    }
                });
            } else {
                response.render('project/node/container/overview.html.twig', {
                    action: 'project.nodes',
                    subaction: 'overview',
                    container: {},
                    error: error
                });
            }
        });
    });

    /**
     * Images - list
     */
    application.getExpress().get('/node/:nodeId/images/list/', function (request, response) {
        getDocker(request).listImages((error, images) => {
            if (error === null) {
                response.render('project/node/images.list.html.twig', {
                    images: images
                });
            } else {
                response.render('project/node/images.list.html.twig', {
                    images: {},
                    error: error
                });
            }
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

    /**
     * Run a command
     */
    application.getExpress().get('/node/:nodeId/run/', function (request, response) {
        response.render('project/node/run.html.twig', {
            action: 'project.nodes',
            subaction: 'run'
        });
    });

};
