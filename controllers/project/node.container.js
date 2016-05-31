"use strict";

/**
 * node.container.js - actions about container in a node
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
     * Middleware to set container in the request
     */
    application.getExpress().all('/node/:nodeId/containers/:containerId/*', (request, response, next) => {
        request.container = request.getDocker().getContainer(request.params.containerId);

        return next();
    });

    /**
     * List
     */
    application.getExpress().get('/node/:nodeId/containers/list/', (request, response) => {
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
    application.getExpress().get('/node/:nodeId/containers/:containerId/overview/', (request, response) => {
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

    /**
     * Validates request with nodeId & containerId Also connects to node and returns container
     *
     * @param params
     * @param {User} user - auth'ed user
     * @param {function} callback - null|string (error, if present), container (container)
     */
    function validateRequestAndGetContainer(params, user, callback) {
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

                            return callback(null, container);
                        };

                        // check does user have access to this node
                        if (application.getUserManager().isUserUser(user) && (user.getLocalId() !== project.getId())) {
                            application.getProjectManager().getUserRoleInProjects(user.getId, (error, roles) => {
                                if (error === null) {
                                    if (roles.hasOwnProperty(project.getId())) {
                                        process();
                                    } else {
                                        return callback('user tried to read logs from project [' + project.getId() +
                                            '] where he does not have access', null);
                                    }
                                } else {
                                    return callback(error, null);
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
        validateRequestAndGetContainer(params, user, (error, container) => {
            if (error === null) {
                container.logs({ follow: true, stdout: true, stderr: true }, (error, stream) => {
                    if (error === null) {
                        const StringDecoder = require('string_decoder').StringDecoder;
                        const decoder = new StringDecoder('utf8');

                        stream.on('end', () => {
                            socket.emit('data', { data: '\n+++ Lost connection. Container was stopped? +++' });
                            return socket.disconnect();
                        });

                        stream.on('data', (chunk) => {
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

                socket.emit('data', { error: error });
                return socket.disconnect();
            }
        });
    }

    /**
     * Stream attached command
     *
     * @param {Object} socket - socket.io websocket
     * @param {Object} params - request params
     * @param {User} user - request author
     * @param {winston.logger} websocketLogger - logger instance
     */
    function streamCommand(socket, params, user, websocketLogger) {
        var command = params.command;

        if ((typeof command === 'undefined') || (command === null) || (command.trim().length == 0)) {
            websocketLogger.error('[command] no command in the request');

            socket.emit('data', { error: 'Empty command' });
            return socket.disconnect();
        }

        validateRequestAndGetContainer(params, user, (error, container) => {
            if (error === null) {
                command = command.trim();

                websocketLogger.info('[ATTACHED COMMAND] "' + command + '"');
                container.exec(
                    {
                        'AttachStdin' : true,
                        'AttachStdout' : true,
                        'AttachStderr' : true,
                        'Tty' : true,
                        'Cmd' : [
                            '/bin/bash', '-c', command
                        ]
                    }, (error, exec) => {
                        if (error === null) {
                            exec.start(
                                { 'hijack' : true, 'stdin' : true, 'Detach' : false, 'Tty' : true },
                                (error, stream) => {
                                    if (error === null) {
                                        const StringDecoder = require('string_decoder').StringDecoder;
                                        const decoder = new StringDecoder('utf8');

                                        /** to avoid loop between socket.disconnect() <-> stream.end() */
                                        var terminatingRequest = false;

                                        /**
                                         * following code really needs locks / critical sections
                                         */
                                        
                                        stream.on('end', () => {
                                            websocketLogger.info('[ATTACHED COMMAND] stream to container closed');

                                            if (!terminatingRequest) {
                                                terminatingRequest = true;

                                                socket.emit('data', { data: '\n\nEnd of transmitted response' });
                                                return socket.disconnect();
                                            }
                                        });

                                        stream.on('data', (chunk) => {
                                            socket.emit('data', { data: decoder.write(chunk) });
                                        });

                                        // send ctrl + c and close stream
                                        var killCommand = () => {
                                            const CTRL_C = '\u0003';

                                            stream.write(CTRL_C);
                                            stream.end();
                                        };

                                        // kill command
                                        socket.on('kill', () => {
                                            websocketLogger.info('[ATTACHED COMMAND] received kill command');

                                            killCommand();
                                        });

                                        // detach command
                                        socket.on('detach', () => {
                                            websocketLogger.info('[ATTACHED COMMAND] received detach command');

                                            const
                                                CTRL_P = '\u0010',
                                                CTRL_Q = '\u0011';

                                            stream.write(CTRL_P);
                                            stream.write(CTRL_Q);
                                        });

                                        socket.on('disconnect', () => {
                                            websocketLogger.info('[ATTACHED COMMAND] socket disconnected');

                                            if (!terminatingRequest) {
                                                terminatingRequest = true;

                                                killCommand();
                                            }
                                        });

                                    } else {
                                        websocketLogger.error(error);

                                        socket.emit('data', { error: error });
                                        return socket.disconnect();
                                    }
                                }
                            )
                        } else {
                            websocketLogger.error(error);
                            
                            socket.emit('data', { error: error });
                            return socket.disconnect();
                        }
                    }
                );

            } else {
                websocketLogger.error('[command] ' + error);

                socket.emit('data', { error: error });
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
         * Run attached command
         */
        socket.on('command', (params) => {
            return streamCommand(socket, params, user, websocketLogger)
        });

    });

    /**
     * Container log
     */
    application.getExpress().get('/node/:nodeId/containers/:containerId/containerlog/', (request, response) => {
        return response.render('project/node/container/containerlog.html.twig', {
            action: 'project.nodes',
            subaction: 'containerlog'
        });
    });

    /**
     * Custom logs
     */
    application.getExpress().get('/node/:nodeId/containers/:containerId/customlogs/', (request, response) => {
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
                request.logger.error(error);

                return response.render('project/node/container/customlogs.html.twig', {
                    action: 'project.nodes',
                    subaction: 'customlogs',
                    error: 'Got error. Contact your system administrator'
                });
            }
        });
    });

    /**
     * Run a command - page
     */
    application.getExpress().get('/node/:nodeId/containers/:containerId/run/', (request, response) => {
        return response.render('project/node/container/run.html.twig', {
            action: 'project.nodes',
            subaction: 'run'
        });
    });

    /**
     * Run a command - handler, for detached mode
     */
    application.getExpress().post('/node/:nodeId/containers/:containerId/run/', (request, response) => {
        var command = request.body.command;

        if ((typeof command === 'undefined') || (command === null) || (command.trim().length === 0)) {
            request.logger.error('[DETACHED COMMAND] - no command in the request');

            return response.json({ error: 'Wrong request' });
        }

        command = command.trim();

        request.logger.info('[DETACHED COMMAND] "' + command + '"');
        request.container.exec(
            {
                'AttachStdin' : false,
                'AttachStdout' : false,
                'AttachStderr' : false,
                'Tty' : false,
                'Cmd' : [
                    '/bin/bash', '-c', command
                ]
            }, (error, exec) => {
                if (error === null) {
                    exec.start({ 'Detach' : true, 'Tty' : false }, (error, stream) => {
                        if (error === null) {
                            request.logger.info('[DETACHED COMMAND] - executed');

                            return response.json({ data: 'Executed!' });
                        } else {
                            request.logger.error(error);

                            return response.json({ error: error });
                        }
                    })
                } else {
                    request.logger.error(error);

                    return response.json({ error: error });
                }
            }
        );
    });

    /**
     * Stop
     */
    application.getExpress().get('/node/:nodeId/containers/:containerId/stop/', (request, response) => {
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
                                    {
                                        request: request,
                                        container: containers[index]
                                    },
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
    application.getExpress().get('/node/:nodeId/containers/:containerId/start/', (request, response) => {
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
                                    {
                                        request: request,
                                        container: containers[index]
                                    },
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
    application.getExpress().get('/node/:nodeId/containers/:containerId/delete/', (request, response) => {
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
    application.getExpress().get('/node/:nodeId/containers/:containerId/stats/', (request, response) => {
        response.render('project/node/container/stats.html.twig', {
            action: 'project.nodes',
            subaction: 'stats'
        });
    });

    /**
     * Stats - data
     */
    application.getExpress().post('/node/:nodeId/containers/:containerId/stats/', (request, response) => {
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
