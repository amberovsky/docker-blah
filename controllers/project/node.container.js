"use strict";

/**
 * node.container.js - actions about container in a node
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
     * Middleware to set container in the request
     */
    application.getExpress().all('/node/:nodeId/containers/:containerId/*', function (request, response, next) {
        request.container = request.getDocker().getContainer(request.params.containerId);

        return next();
    });

    /**
     * List
     */
    application.getExpress().get('/node/:nodeId/containers/list/', function (request, response) {
        request.getDocker().listContainers({ all: true }, (error, containers) => {
            if (error === null) {
                return response.render('project/node/containers.list.html.twig', {
                    containers: containers
                });
            } else {
                request.logger.error(error);
                
                return response.render('project/node/containers.list.html.twig', {
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
                        return response.render('project/node/container/overview.html.twig', {
                            action: 'project.nodes',
                            subaction: 'overview',
                            container: containerInfo,
                            top: top.Processes,
                            topCount: top.Processes.length
                        });
                    } else {
                        request.logger.error(error);
                        
                        return response.render('project/node/container/overview.html.twig', {
                            action: 'project.nodes',
                            subaction: 'overview',
                            container: {},
                            error: error
                        });
                    }
                });
            } else {
                request.logger.error(error);
                
                return response.render('project/node/container/overview.html.twig', {
                    action: 'project.nodes',
                    subaction: 'overview',
                    container: {},
                    error: error
                });
            }
        });
    });

    function validateLogRequestAndGetContainer(params, user, callback) {
        var
            nodeId = parseInt(params.nodeId),
            containerId = params.containerId;

        if (Number.isNaN(nodeId)) {
            return callback('wrong nodeId [' + params.nodeId + ']', null);
        }

        if ((typeof containerId === 'undefined') || (containerId === null) || (containerId.trim().length == 0)) {
            return callback('no containerId in the request', null);
        }

        application.getNodeManager().getById(nodeId, (error, node) => {
            if (node === null) {
                return callback('node with id [' + nodeId + '] does not exist', null);
            }

            if (error === null) {
                application.getProjectManager().getById(node.getProjectId(), (error, project) => {
                    if (project === null) {
                        return callback('project with id [' + node.getProjectId() + '] does not exist in the node [' +
                            node.getId() + ' - ' + node.getName() + ']', null);
                    }

                    if (error === null) {
                        var process = () => {
                            var
                                docker = application.dockerUtils.createDockerCustom(
                                    node.getIp(), node.getPort(), project.getCA(), project.getCERT(), project.getKEY()
                                ),
                                container = docker.getContainer(containerId);

                            callback(null, container);
                        };

                        // check does user have access to this node
                        if (application.getUserManager().isUserUser(user)) {
                            application.getProjectManager().getUserRoleInProjects(user.getId, (error, roles) => {
                                if (error === null) {
                                    if (roles.hasOwnProperty(project.getId())) {
                                        process();
                                    } else {
                                        return callback('user tried to read logs from project [' + project.getId() +
                                            '] where he does not have access', null);
                                    }
                                }
                            });
                        } else {
                            process();
                        }

                    } else {
                        return callback(error, null);
                    }
                });
            } else {
                return callback(error, null);
            }
        });
    }

    /**
     * Stream container's "main" log
     *
     * @param {Object} socket - socket.io websocket
     * @param {Object} params - request params
     * @param {User} user - request author
     * @param {winston.logger} websocketLogger - logger instance
     */
    function streamContainerLog(socket, params, user, websocketLogger) {
        validateLogRequestAndGetContainer(params, user, (error, container) => {
            if (error === null) {
                container.logs({ follow: true, stdout: true, stderr: true }, (error, dockerStream) => {
                    if (error === null) {
                        const StringDecoder = require('string_decoder').StringDecoder;
                        const decoder = new StringDecoder('utf8');

                        dockerStream.on('end', () => {
                            socket.emit('data', { data: 'Lost connection. Container was stopped?' });
                            return socket.disconnect();
                        });

                        dockerStream.on('data', (chunk) => {
                            socket.emit('data', { data: decoder.write(chunk) });
                        });

                    } else {
                        websocketLogger.error(error);
                        socket.emit('data', { error: error });
                        return socket.disconnect();
                    }
                })

            } else {
                websocketLogger.error('[containerlog] ' + error);
                return socket.disconnect();
            }
        });
    }

    /**
     * Stream container's custom log
     *
     * @param {Object} socket - socket.io websocket
     * @param {Object} params - request params
     * @param {User} user - request author
     * @param {winston.logger} websocketLogger - logger instance
     */
    function streamCustomLog(socket, params, user, websocketLogger) {
        var log = params.log;

        if ((typeof log === 'undefined') || (log === null) || (log.trim().length == 0)) {
            websocketLogger.error('[customlog] no log in the request');
            return socket.disconnect();
        }

        validateLogRequestAndGetContainer(params, user, (error, container) => {
            if (error === null) {
                
            } else {
                websocketLogger.error('[customlog] ' + error);
                return socket.disconnect();
            }
        });
    }

    /**
     * Websocket events
     */
    application.getWebSocketEventEmitter().on('connection', (socket, user, websocketLogger) => {
        /**
         * Stream container's "main" log
         */
        socket.on('containerlog', (params) => {
            return streamContainerLog(socket, params, user, websocketLogger)
        });

        /**
         * Stream container's custom log
         */
        socket.on('customlog', (params) => {
            return streamCustomLog(socket, params, user, websocketLogger)
        });

    });

    /**
     * Container log
     */
    application.getExpress().get('/node/:nodeId/containers/:containerId/containerlog/', function (request, response) {
        return response.render('project/node/container/containerlog.html.twig', {
            action: 'project.nodes',
            subaction: 'containerlog'
        });
    });

    /**
     * Custom logs
     */
    application.getExpress().get('/node/:nodeId/containers/:containerId/customlogs/', function (request, response) {
        request.projectLogManager.getByProjectId(request.project.getId(), (error, projectLog) => {
            if (error === null) {
                return response.render('project/node/container/customlogs.html.twig', {
                    action: 'project.nodes',
                    subaction: 'customlogs',
                    projectLog: (projectLog === null
                        ? request.projectLogManager.create(request.project.getId())
                        : projectLog)
                });
            } else {
                request.loger.error(error);

                return response.render('project/node/container/customlogs.html.twig', {
                    action: 'project.nodes',
                    subaction: 'customlogs',
                    error: 'Got error. Contact your system administrator'
                });
            }
        });
    });

    /**
     * Run a command
     */
    application.getExpress().get('/node/:nodeId/containers/:containerId/run/', function (request, response) {
        return response.render('project/node/container/run.html.twig', {
            action: 'project.nodes',
            subaction: 'run'
        });
    });

    /**
     * Stop
     */
    application.getExpress().get('/node/:nodeId/containers/:containerId/stop/', function (request, response) {
        request.container.stop((error) => {
            if (error === null) {
                request.getDocker().listContainers({ all: true }, (error, containers) => {
                    if (error === null) {
                        var found = false;
                        for (var index in containers) {
                            if (containers[index].Id === request.container.id) {
                                found = true;
                                application.getExpress().render(
                                    'project/node/containers.list.partial.html.twig',
                                    { container: containers[index] },
                                    (error, html) => {
                                        if (error === null) {
                                            request.logger.info('Container [' + request.container.id + '] was stopped');
                                            
                                            return response.json({
                                                success: 1,
                                                containerInfo: html
                                            });
                                        } else {
                                            request.logger.error(error);
                                            
                                            return response.json({
                                                error: 'Got error. Contact your system administrator.'
                                            });
                                        }
                                    }
                                );
                            }
                        }

                        if (!found) {
                            request.logger.error('Unable to found container in the list after applied operation.');
                            
                            return response.json({
                                error: 'Unable to found container in the list after applied operation.'
                            });
                        }
                    } else {
                        request.logger.error(error);
                        
                        return response.json({
                            error: 'Unable to list containers on the node.'
                        });
                    }
                });
            } else {
                request.logger.error(error);
                
                return response.json({ error: JSON.stringify(error) });
            }
        })
    });

    /**
     * Start
     */
    application.getExpress().get('/node/:nodeId/containers/:containerId/start/', function (request, response) {
        request.container.start((error) => {
            if (error === null) {
                request.getDocker().listContainers({ all: true }, (error, containers) => {
                    if (error === null) {
                        var found = false;
                        for (var index in containers) {
                            if (containers[index].Id === request.container.id) {
                                found = true;
                                application.getExpress().render(
                                    'project/node/containers.list.partial.html.twig',
                                    { container: containers[index] },
                                    (error, html) => {
                                        if (error === null) {
                                            request.logger.info('Container [' + request.container.id + '] was started');
                                            return response.json({
                                                success: 1,
                                                containerInfo: html
                                            });
                                        } else {
                                            request.logger.error(error);
                                            
                                            return response.json({
                                                error: 'Got error. Contact your system administrator.'
                                            });
                                        }
                                    }
                                );
                            }
                        }

                        if (!found) {
                            request.logger.error('Unable to found container in the list after applied operation.');
                            
                            return response.json({
                                error: 'Unable to found container in the list after applied operation.'
                            });
                        }
                    } else {
                        request.logger.error(error);
                        
                        return response.json({
                            error: 'Unable to list containers on the node.'
                        });
                    }
                });
            } else {
                request.logger.error(error);
                
                return response.json({ error: JSON.stringify(error) });
            }
        })
    });

    /**
     * Delete
     */
    application.getExpress().get('/node/:nodeId/containers/:containerId/delete/', function (request, response) {
        request.container.remove({ v: true }, (error) => {
            if (error === null) {
                request.logger.info('Container [' + request.container.id + '] was deleted');

                return response.json({
                    success: 1,
                    containerInfo: ''
                });
            } else {
                request.logger.error(error);

                return response.json({ error: JSON.stringify(error) });
            }
        })
    });

    /**
     * Stats - page
     */
    application.getExpress().get('/node/:nodeId/containers/:containerId/stats/', function (request, response) {
        response.render('project/node/container/stats.html.twig', {
            action: 'project.nodes',
            subaction: 'stats'
        });
    });

    /**
     * Stats - data
     */
    application.getExpress().post('/node/:nodeId/containers/:containerId/stats/', function (request, response) {
        var
            cpuTotalUsage = parseFloat(request.body.cpu_totalusage),
            cpuSystemUsage = parseFloat(request.body.cpu_systemusage),
            cpuPercent = 0.0;

        request.container.stats({ stream: 0 }, (error, stream) => {
            if (error === null) {
                var buffer = '';

                stream.on('data', (chunk) => {
                    buffer += chunk;
                });

                stream.on('end', () => {
                    var stats = JSON.parse(buffer);
                    
                    if (!Number.isNaN(cpuTotalUsage)) {
                        // if it is not a first request then we have previous data in the request

                        // calculate CPU usage
                        var
                            cpuDelta = stats.cpu_stats.cpu_usage.total_usage - cpuTotalUsage,
                            systemDelta = stats.cpu_stats.system_cpu_usage - cpuSystemUsage;

                        if ((cpuDelta > 0.0) && (systemDelta > 0.0)) {
                            cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.cpu_usage.percpu_usage.length * 100.0;
                        }
                    }

                    // calculate Bulk IO
                    var
                        blkRead = 0,
                        blkWrite = 0;

                    for (var index in stats.blkio_stats.io_service_bytes_recursive) {
                        switch (stats.blkio_stats.io_service_bytes_recursive[index].op) {
                            case 'Read':
                                blkRead += stats.blkio_stats.io_service_bytes_recursive[index].value;
                                break;

                            case 'Write':
                                blkWrite += stats.blkio_stats.io_service_bytes_recursive[index].value;
                                break;
                        }
                    }

                    return response.render('project/node/container/stats.data.html.twig', {
                        stats: stats,
                        cpuPercent: cpuPercent,
                        blkRead: blkRead,
                        blkWrite: blkWrite
                    });
                });

            } else {
                request.logger.error(error);

                return response.render('project/node/container/stats.data.html.twig', {
                    error: error
                });
            }
        });
    });

};
