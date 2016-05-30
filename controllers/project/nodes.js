"use strict";

/**
 * nodes.js - project nodes
 *
 * /project/:projectId/nodes/* 
 *
 * (C) Anton Zagorskii aka amberovsky amberovsky@gmail.com
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * Renders template for all nodes
     *
     * @param {Object} request - expressjs request
     * @param {Object} response - expressjs response
     * @param {(string|null)} error - error message, if present 
     * @param {(string|null)} success - success message, if present
     */
    function routeToAllNodes(request, response, error = null, success = null) {
        return request.nodeManager.getByProjectId(request.project.getId(), (allNodesError, nodes) => {
            response.render('project/nodes/nodes.html.twig', {
                action: 'project.nodes',
                nodes: nodes,
                nodesCount: Object.keys(nodes).length,
                success: success,
                error: error
            });
        });
    };

    /**
     * View nodes in project
     */
    application.getExpress().get('/project/:projectId/nodes/', (request, response) => {
        return routeToAllNodes(request, response);
    });
    
    /**
     * Create a new node - page
     */
    application.getExpress().get('/project/:projectId/nodes/create/', (request, response) => {
        if (!request.isUserAdminForThisProject) {
            request.logger.info('user doesn\'t have enough rights for this action');

            return routeToAllNodes(request, response);
        }

        if (request.project.getUserId() !== -1) {
            request.logger.info('Local docker requested, should be only in /profile/local');

            return routeToAllNodes(request, response, 'Wrong request');
        }

        request.node = request.nodeManager.create(request.project.getId());

        return response.render('project/nodes/node.html.twig', {
            action: 'project.nodes',
            subaction: 'create'
        });
    });

    /**
     * Create a new node - handler
     */
    application.getExpress().post('/project/:projectId/nodes/create/', (request, response) => {
        if (!request.isUserAdminForThisProject) {
            request.logger.info('user doesn\'t have enough rights for this action');

            return routeToAllNodes(request, response);
        }

        if (request.project.getUserId() !== -1) {
            request.logger.info('Local docker requested, should be only in /profile/local');

            return routeToAllNodes(request, response, 'Wrong request');
        }

        request.node = request.nodeManager.create(request.project.getId());

        request.nodeUtils.validateNodeActionCreateNewOrUpdate(false, (error) => {
            if (error === null) {
                request.nodeManager.add(request.node, (error) => {
                    if (error === null) {
                        request.logger.info('new node [' + request.node.getName() + '] in project [' +
                            request.project.getName() + '] was created');
                        
                        return routeToAllNodes(
                            request, response, null, 'Node [' + request.node.getName() + '] was created'
                        );
                    } else {
                        request.logger.error(error);

                        return response.render('project/nodes/node.html.twig', {
                            action: 'project.nodes',
                            subaction: 'create',
                            error: 'Got error. Contact your system administrator.'
                        });
                    }
                });
            } else {
                return response.render('project/nodes/node.html.twig', {
                    action: 'project.nodes',
                    subaction: 'create',
                    error: error
                });
            }
        });
    });
    
    /**
     * Middleware to preload node if there is a nodeId in the url, and avoid manipulation with local docker
     */
    application.getExpress().all('/project/:projectId/nodes/:nodeId/*', (request, response, next) => {
        if (request.project.getUserId() !== -1) {
            request.logger.error('Local docker requested, should be only in /profile/local');

            return routeToAllNodes(request, response, 'Wrong request');
        }

        var nodeId = parseInt(request.params.nodeId);

        if (Number.isNaN(nodeId)) {
            request.logger.info('node was requested by non-NAN id [' + nodeId + ']');

            return routeToAllNodes(request, response, 'Wrong node id');
        }

        request.nodeManager.getByIdAndProjectId(nodeId, request.project.getId(), (error, node) => {
            if (node === null) {
                request.logger.info('non-existed node [' + nodeId + '] in project [' + request.project.getId() +
                    '] was requested');

                return routeToAllNodes(request, response, 'Node with given id doesn\'t exist');
            }

            request.node = node;
            return next();
        });
    });

    /**
     * View/Edit node
     */
    application.getExpress().get('/project/:projectId/nodes/:nodeId/', (request, response) => {
        if (!request.isUserAdminForThisProject) {
            request.logger.info('user doesn\'t have enough rights for this action');

            return routeToAllNodes(request, response);
        }

        return response.render('project/nodes/node.html.twig', {
            action: 'project.nodes',
            subaction: 'edit'
        });
    });

    /**
     * Update node info
     */
    application.getExpress().post('/project/:projectId/nodes/:nodeId/', (request, response) => {
        if (!request.isUserAdminForThisProject) {
            request.logger.info('user doesn\'t have enough rights for this action');

            return routeToAllNodes(request, response);
        }

        request.nodeUtils.validateNodeActionCreateNewOrUpdate(true, (error) => {
            if (error !== null) {
                return response.render('project/nodes/node.html.twig', {
                    action: 'project.nodes',
                    subaction: 'edit',
                    error: error
                });
            }

            request.nodeManager.update(request.node, function (error) {
                if (error === null) {
                    request.logger.info('node [' + request.node.getName() + '] in project [' +
                        request.project.getName() + '] was updated.');

                    return routeToAllNodes(
                        request, response, null, 'Node [' + request.node.getName() + '] info was updated.'
                    );
                } else {
                    request.logger.error(error);

                    return response.render('project/nodes/node.html.twig', {
                        action: 'project.nodes',
                        subaction: 'edit',
                        error: 'Got error. Contact your system administrator.'
                    });
                }
            });
        });
    });

    /**
     * Delete node - page
     */
    application.getExpress().get('/project/:projectId/nodes/:nodeId/delete/', (request, response) => {
        if (!request.isUserAdminForThisProject) {
            request.logger.info('user doesn\'t have enough rights for this action');

            return routeToAllNodes(request, response);
        }

        response.render('project/nodes/delete.html.twig', {
            action: 'project.nodes'
        });
    });

    /**
     * Delete node - handler
     */
    application.getExpress().post('/project/:projectId/nodes/:nodeId/delete/', (request, response) => {
        if (!request.isUserAdminForThisProject) {
            request.logger.info('user doesn\'t have enough rights for this action');

            return routeToAllNodes(request, response);
        }
        
        request.nodeManager.deleteNode(request.node.getId(), function (error) {
            if (error === null) {
                request.logger.info('node [' + request.node.getName() + '] in project [' + request.project.getName() +
                    '] was deleted.');

                return routeToAllNodes(request, response, null, 'Node [' + request.node.getName() + '] was deleted.');
            } else {
                request.logger.error(error);

                return routeToAllNodes(request, response, 'Got error. Contact your system administrator.');
            }
        });
    });
    
};
