"use strict";

/**
 * node.container.js - actions about container in a node
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
     * Middleware to set container in the request
     */
    application.getExpress().all('/node/:nodeId/containers/:containerId/*', function (request, response, next) {
        request.container = getDocker(request).getContainer(request.params.containerId);

        return next();
    });

    /**
     * List
     */
    application.getExpress().get('/node/:nodeId/containers/list/', function (request, response) {
        getDocker(request).listContainers({ all: true }, (error, containers) => {
            if (error === null) {
                response.render('project/node/containers.list.html.twig', {
                    containers: containers
                });
            } else {
                request.logger.error(error);
                
                response.render('project/node/containers.list.html.twig', {
                    containers: {},
                    error: error
                });
            }
        });
    });

    /**
     * Overview
     */
    application.getExpress().get('/node/:nodeId/containers/:containerId/overview/', function (request, response) {
        request.container.inspect((error, containerInfo) => {
            if (error === null) {
                request.container.top({ ps_args: 'aux' }, (error, top) => {
                    if (error === null) {
                        response.render('project/node/container/overview.html.twig', {
                            action: 'project.nodes',
                            subaction: 'overview',
                            container: containerInfo,
                            top: top.Processes,
                            topCount: top.Processes.length
                        });
                    } else {
                        request.logger.error(error);
                        
                        response.render('project/node/container/overview.html.twig', {
                            action: 'project.nodes',
                            subaction: 'overview',
                            container: {},
                            error: error
                        });
                    }
                });
            } else {
                request.logger.error(error);
                
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
     * Logs
     */
    application.getExpress().get('/node/:nodeId/containers/:containerId/logs/', function (request, response) {
        response.render('project/node/container/logs.html.twig', {
            action: 'project.nodes',
            subaction: 'logs'
        });
    });

    /**
     * Run a command
     */
    application.getExpress().get('/node/:nodeId/containers/:containerId/run/', function (request, response) {
        response.render('project/node/container/run.html.twig', {
            action: 'project.nodes',
            subaction: 'run'
        });
    });

};
