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
    
    /**
     * Middleware to set image in the request
     */
    application.getExpress().all('/node/:nodeId/images/:imageId/*', function (request, response, next) {
        request.image = request.dockerUtils.getDocker().getImage(request.params.imageId);

        return next();
    });

    /**
     * List
     */
    application.getExpress().get('/node/:nodeId/images/list/', function (request, response) {
        request.dockerUtils.getDocker().listImages((error, images) => {
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
        request.dockerUtils.getDocker().getImage(request.image.name).remove((error) => {
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
