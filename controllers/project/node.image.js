"use strict";

/**
 * node.image.js - actions about image in a node
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
     * Middleware to set image in the request
     */
    application.getExpress().all('/node/:nodeId/images/:imageId/*', function (request, response, next) {
        request.image = getDocker(request).getImage(request.params.imageId);

        return next();
    });

    /**
     * List
     */
    application.getExpress().get('/node/:nodeId/images/list/', function (request, response) {
        getDocker(request).listImages((error, images) => {
            if (error === null) {
                response.render('project/node/images.list.html.twig', {
                    images: images
                });
            } else {
                request.logger.error(error);

                response.render('project/node/images.list.html.twig', {
                    images: {},
                    error: error
                });
            }
        });
    });
    
    /**
     * Delete - page
     */
    application.getExpress().get('/node/:nodeId/images/:imageId/delete/', function (request, response) {
        response.render('project/node/image/delete.html.twig', {
            action: 'project.nodes'
        });
    });

    /**
     * Delete - handler
     */
    application.getExpress().post('/node/:nodeId/images/:imageId/delete/', function (request, response) {
        getDocker(request).getImage(request.image.name).remove((error) => {
            if (error === null) {
                request.logger.info('Image [' + request.image.name + '] in project [' + request.project.getId() +
                    ' - ' + request.project.getName() + '] in node [' + request.node.getId() + ' - ' +
                    request.node.getName() + '] was deleted');

                return response.render('project/node/images.html.twig', {
                    action: 'project.nodes',
                    success: 'Image ' + request.image.name + ' was deleted',
                    subaction: 'images'
                });
            } else {
                request.logger.error(error);

                return response.render('project/node/image/delete.html.twig', {
                    action: 'project.nodes',
                    error: error
                });
            }
        });
    });

};
