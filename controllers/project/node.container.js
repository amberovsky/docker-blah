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
    
    /**
     * Middleware to set container in the request
     */
    application.getExpress().all('/node/:nodeId/containers/:containerId/*', function (request, response, next) {
        request.container = request.dockerUtils.getDocker().getContainer(request.params.containerId);

        return next();
    });

    /**
     * List
     */
    application.getExpress().get('/node/:nodeId/containers/list/', function (request, response) {
        request.dockerUtils.getDocker().listContainers({ all: true }, (error, containers) => {
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

    /**
     * Logs
     */
    application.getExpress().get('/node/:nodeId/containers/:containerId/logs/', function (request, response) {
        return response.render('project/node/container/logs.html.twig', {
            action: 'project.nodes',
            subaction: 'logs'
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
                request.dockerUtils.getDocker().listContainers({ all: true }, (error, containers) => {
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
                request.dockerUtils.getDocker().listContainers({ all: true }, (error, containers) => {
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
