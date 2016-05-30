"use strict";

/**
 * node.image.js - actions about image in a node
 *
 * /node/:nodeId/
 *
 * Copyright (C) 2016 Anton Zagorskii aka amberovsky. All rights reserved. Contacts: <amberovsky@gmail.com>
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {
    
    /**
     * Middleware to set image in the request
     */
    application.getExpress().all('/node/:nodeId/images/:imageId/*', (request, response, next) => {
        request.image = request.getDocker().getImage(request.params.imageId);

        return next();
    });

    /**
     * List
     */
    application.getExpress().get('/node/:nodeId/images/list/', (request, response) => {
        request.getDocker().listImages((error, images) => {
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
    application.getExpress().get('/node/:nodeId/images/:imageId/delete/', (request, response) => {
        response.render('project/node/image/delete.html.twig', {
            action: 'project.nodes'
        });
    });

    /**
     * Delete - handler
     */
    application.getExpress().post('/node/:nodeId/images/:imageId/delete/', (request, response) => {
        request.getDocker().getImage(request.image.name).remove((error) => {
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
