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
        return request.nodeManager.filterByProjectId(request.project.getId(), (allNodesError, nodes) => {
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
        request.node = request.nodeManager.create(request.project.getId());

        return response.render('project/nodes/node.html.twig', {
            action: 'project.nodes',
            subaction: 'create'
        });
    });

    /**
     * Validate request for create new project or update existing
     *
     * @param {Object} request - express request
     * @param {boolean} isUpdate - is it update operation or create new
     * @param {DatabaseOperationCallback} callback - database operation callback
     */
    function validateNodeActionCreateNewOrUpdate(request, isUpdate, callback) {
        var
            name = request.body.name,
            ip = request.body.ip;
        
        request.node
            .setName(name)
            .setIp(ip);

        if ((typeof name === 'undefined') || (typeof ip === 'undefined')) {
            return callback('Not enough data in the request.');
        }

        name = name.trim();
        ip = ip.trim();

        if (name.length < request.nodeManager.MIN_TEXT_FIELD_LENGTH) {
            return callback('Name should be at least ' + request.nodeManager.MIN_TEXT_FIELD_LENGTH + ' characters.');
        }

        var IP = require('ip');

        if (!IP.isV4Format(ip) || (IP.fromLong(IP.toLong(ip)) !== ip)) {
            return callback('IP has to be in v4 format');
        }

        var nodeId = (isUpdate === true) ? request.node.getId() : -1;

        request.nodeManager.doesExistWithSameNameOrIpInProject(name, ip, nodeId, request.project, (error, check) => {
            if (check) {
                return callback('Node with name [' + name + '] or ip [' + ip + '] already exists in this project.');
            }

            request.node
                .setName(name)
                .setIp(ip);

            return callback(null);
        });
    }

    /**
     * Create a new node - handler
     */
    application.getExpress().post('/project/:projectId/nodes/create/', function (request, response) {
        request.node = request.nodeManager.create(request.project.getId());

        validateNodeActionCreateNewOrUpdate(request, false, (error) => {
            if (error === null) {
                request.nodeManager.add(request.node, (error) => {
                    if (error === null) {
                        request.logger.info('new node [' + request.node.getName() + '] in project [' +
                            request.project.getName() + '] was created');
                        
                        return routeToAllNodes(
                            request, response, 'Node [' + request.node.getName() + '] was created', error
                        );
                    } else {
                        return response.render('project/nodes/node.html.twig', {
                            action: 'project.nodes',
                            subaction: 'create',
                            error: 'Got error during create. Contact your system administrator.'
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
            request.logger.info('node was requested by non-NAN id [' + nodeId + '], url : ' +
                request.originalUrl);

            return routeToAllNodes(request, response, null, 'Wrong node id');
        }

        request.nodeManager.getByIdAndProjectId(nodeId, request.project.getId(), (error, node) => {
            if (node === null) {
                request.logger.info('non-existed node [' + nodeId + '] in project [' + request.project.getId() +
                    '] was requested, url : ' + request.originalUrl);

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
        return response.render('project/nodes/node.html.twig', {
            action: 'project.nodes',
            subaction: 'edit'
        });
    });

    /**
     * Update node info
     */
    application.getExpress().post('/project/:projectId/nodes/:nodeId/', function (request, response) {
        validateNodeActionCreateNewOrUpdate(request, true, (error) => {
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
                    return response.render('project/nodes/node.html.twig', {
                        action: 'project.nodes',
                        subaction: 'edit',
                        error: 'Got error during update. Contact your system administrator.'
                    });
                }
            });
        });
    });

    /**
     * Delete node - page
     */
    application.getExpress().get('/project/:projectId/nodes/:nodeId/delete/', function (request, response) {
        response.render('project/nodes/delete.html.twig', {
            action: 'project.nodes'
        });
    });

    /**
     * Delete node - handler
     */
    application.getExpress().post('/project/:projectId/nodes/:nodeId/delete/', function (request, response) {
        request.nodeManager.deleteNode(request.node.getId(), function (error) {
            if (error === null) {
                request.logger.info('node [' + request.node.getName() + '] in project [' + request.project.getName() +
                    '] was deleted.');

                return routeToAllNodes(
                    request, response, 'Node [' + request.node.getName() + '] was deleted.', null
                );
            } else {
                return routeToAllNodes(
                    request, response, null, 'Got error during update. Contact your system administrator.'
                );
            }
        });
    });
    
};
