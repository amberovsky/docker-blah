"use strict";

/**
 * nodes.js - project nodes
 *
 * /project/:projectId/nodes/* 
 *
 * (C) Anton Zagorskii aka amberovsky
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
     * @param {(string|null)} success - success message, if present
     * @param {(string|null)} error - error message, if present
     */
    function routeToAllNodes(request, response, success, error) {
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
    application.getExpress().get('/project/:projectId/nodes/', function (request, response) {
        return routeToAllNodes(request, response, null, null);
    });
    
    /**
     * Create a new node - page
     */
    application.getExpress().get('/project/:projectId/nodes/create/', function (request, response) {
        if (!request.isUserAdminForThisProject) {
            request.logger.info('user doesn\'t have enough rights for this action');

            return routeToAllNodes(request, response, null, null);
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
    application.getExpress().post('/project/:projectId/nodes/create/', function (request, response) {
        if (!request.isUserAdminForThisProject) {
            request.logger.info('user doesn\'t have enough rights for this action');

            return routeToAllNodes(request, response, null, null);
        }

        request.node = request.nodeManager.create(request.project.getId());

        request.nodeUtils.validateNodeActionCreateNewOrUpdate(false, (error) => {
            if (error === null) {
                request.nodeManager.add(request.node, (error) => {
                    if (error === null) {
                        request.logger.info('new node [' + request.node.getName() + '] in project [' +
                            request.project.getName() + '] was created');
                        
                        return routeToAllNodes(
                            request, response, 'Node [' + request.node.getName() + '] was created', error
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
     * Middleware to preload node if there is a nodeId in the url
     */
    application.getExpress().all('/project/:projectId/nodes/:nodeId/*', function (request, response, next) {
        var nodeId = parseInt(request.params.nodeId);

        if (Number.isNaN(nodeId)) {
            request.logger.info('node was requested by non-NAN id [' + nodeId + ']');

            return routeToAllNodes(request, response, null, 'Wrong node id');
        }

        request.nodeManager.getByIdAndProjectId(nodeId, request.project.getId(), (error, node) => {
            if (node === null) {
                request.logger.info('non-existed node [' + nodeId + '] in project [' + request.project.getId() +
                    '] was requested');

                return routeToAllNodes(request, response, null, 'Node with given id doesn\'t exist');
            }

            request.node = node;
            return next();
        });
    });

    /**
     * View/Edit node
     */
    application.getExpress().get('/project/:projectId/nodes/:nodeId/', function (request, response) {
        if (!request.isUserAdminForThisProject) {
            request.logger.info('user doesn\'t have enough rights for this action');

            return routeToAllNodes(request, response, null, null);
        }

        return response.render('project/nodes/node.html.twig', {
            action: 'project.nodes',
            subaction: 'edit'
        });
    });

    /**
     * Update node info
     */
    application.getExpress().post('/project/:projectId/nodes/:nodeId/', function (request, response) {
        if (!request.isUserAdminForThisProject) {
            request.logger.info('user doesn\'t have enough rights for this action');

            return routeToAllNodes(request, response, null, null);
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
                        request, response, 'Node [' + request.node.getName() + '] info was updated.', null
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
    application.getExpress().get('/project/:projectId/nodes/:nodeId/delete/', function (request, response) {
        if (!request.isUserAdminForThisProject) {
            request.logger.info('user doesn\'t have enough rights for this action');

            return routeToAllNodes(request, response, null, null);
        }

        response.render('project/nodes/delete.html.twig', {
            action: 'project.nodes'
        });
    });

    /**
     * Delete node - handler
     */
    application.getExpress().post('/project/:projectId/nodes/:nodeId/delete/', function (request, response) {
        if (!request.isUserAdminForThisProject) {
            request.logger.info('user doesn\'t have enough rights for this action');

            return routeToAllNodes(request, response, null, null);
        }
        
        request.nodeManager.deleteNode(request.node.getId(), function (error) {
            if (error === null) {
                request.logger.info('node [' + request.node.getName() + '] in project [' + request.project.getName() +
                    '] was deleted.');

                return routeToAllNodes(
                    request, response, 'Node [' + request.node.getName() + '] was deleted.', null
                );
            } else {
                request.logger.error(error);

                return routeToAllNodes(
                    request, response, null, 'Got error. Contact your system administrator.'
                );
            }
        });
    });
    
};
