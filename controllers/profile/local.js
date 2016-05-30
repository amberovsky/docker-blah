"use strict";

/**
 * local.js - user's local docker
 *
 * /profile/local/*
 *
 * Copyright (C) 2016 Anton Zagorskii aka amberovsky. All rights reserved. Contacts: <amberovsky@gmail.com>
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * Middleware to preload local & related node
     */
    application.getExpress().all('/profile/local/*', (request, response, next) => {
        if (request.user.getLocalId() === -1) {
            // no local docker configured
            request.project = request.projectManager.create().setUserId(request.user.getId());
            request.node = request.nodeManager.create(-1);

            return next();
        }

        request.projectManager.getById(request.user.getLocalId(), (error, project) => {
            if ((error === null) && (project !== null)) {
                request.project = project;

                request.nodeManager.getByProjectId(project.getId(), (error, nodes) => {
                    if ((error === null) && (Object.keys(nodes).length == 1)) {
                        request.node = nodes[Object.keys(nodes)[0]];

                        return next();
                    } else {
                        request.logger.error('unable to fetch nodes for local docker, error: [' + error + ']');

                        return routeToLocalNotConfigured(
                            request, response, 'Got error. Contact your system administrator'
                        );
                    }
                });
            } else {
                request.logger.error('unable to fetch local docker for user, error: [' + error + ']');

                return routeToLocalNotConfigured(request, response, 'Got error. Contact your system administrator');
            }
        });
    });

    /**
     * Route to 'not configured' template
     *
     * @param {Object} request - expressjs request
     * @param {Object} response - expressjs response
     * @param {(null|string)} error - error message, if present
     * @param {(null|string)} success - success message, if present
     */
    function routeToLocalNotConfigured(request, response, error = null, success = null) {
        if (typeof request.node === 'undefined') {
            request.node = request.nodeManager.create(-1);
        }

        if (typeof request.project === 'undefined') {
            request.project = request.projectManager.create().setUserId(request.user.getId());
        }

        return response.render('profile/local/notconfigured.html.twig', {
            action: 'profile.local',
            error: error,
            success: success
        });
    }

    /**
     * Route to 'configured' template
     *
     * @param {Object} response - expressjs response
     * @param {(null|string)} error - error message, if present
     * @param {(null|string)} success - success message, if present
     */
    function routeToLocalConfigured(response, error = null, success = null) {
        return response.render('profile/local/configured.html.twig', {
            action: 'profile.local',
            error: error,
            success: success
        });
    }

    /**
     * Route to 'not configured' or 'configured' template, depending does user have it configured or not
     *
     * @param {Object} request - expressjs request
     * @param {Object} response - expressjs response
     * @param {(null|string)} errorMsg - error message, if present
     * @param {(null|string)} successMsg - success message, if present
     */
    function routeToLocal(request, response, errorMsg = null, successMsg = null) {
        if (request.user.getLocalId() === -1) {
            routeToLocalNotConfigured(request, response, errorMsg, successMsg);
        } else {
            routeToLocalConfigured(response, errorMsg, successMsg);
        }
    }

    /**
     * View local
     */
    application.getExpress().get('/profile/local/', (request, response) => {
        return routeToLocal(request, response);
    });

    /**
     * Handle action "create local docker"
     *
     * @param {Object} request - expressjs request
     * @param {Object} response - expressjs response
     */
    function handleActionCreate(request, response) {
        var processCreateProject = () => {
            request.projectManager.add(request.project, (error) => {
                if (error === null) {
                    request.node.setProjectId(request.project.getId());
                    request.nodeManager.add(request.node, (error) => {
                        if (error === null) {
                            request.user.setLocalId(request.project.getId());
                            request.userManager.update(request.user, (error) => {
                                if (error === null) {
                                    request.local = request.project;

                                    return routeToLocalConfigured(response, null, 'Local docker [' +
                                        request.node.getName() + '] ' + 'was created');
                                } else {
                                    request.logger.error('unable to set local docker id for user, rollback');

                                    request.nodeManager.deleteNode(request.node.getId(), (error) => {
                                        if (error !== null) {
                                            request.logger.error('unable to rollback added node ' + error);
                                        }

                                        request.projectManager.deleteProject(
                                            request.project.getId(), (error) => {
                                                if (error !== null) {
                                                    request.logger.error('unable to rollback added project ' + error);
                                                }

                                                return routeToLocalNotConfigured(
                                                    request, response, 'Got error. Contact your system administrator'
                                                );
                                            })
                                    })
                                }
                            });
                        } else {
                            request.logger.error('unable to create node, rollback');

                            request.projectManager.deleteProject(request.project.getId(), (error) => {
                                if (error !== null) {
                                    request.logger.error('unable to rollback added project ' + error);
                                }

                                return routeToLocalNotConfigured(
                                    request, response, 'Got error. Contact your system administrator'
                                );
                            })
                        }
                    });
                } else {
                    request.logger.error('unable to create new project');

                    return routeToLocalNotConfigured(request, response, 'Got error. Contact your system administrator');
                }
            });
        };

        if (request.user.getLocalId() === -1) {
            request.nodeUtils.validateNodeActionCreateNewOrUpdate(false, (error) => {
                if (error === null) {
                    request.projectUtils.validateProjectActionCreateNewOrUpdateProject(false, (error) => {
                        if (error === null) {
                            return processCreateProject();
                        } else {
                            return routeToLocalNotConfigured(request, response, error);
                        }
                    });
                } else {
                    return routeToLocalNotConfigured(request, response, error);
                }
            });
        } else {
            // user already has local docker
            request.logger.error('Attempt to create local docker when it already was created');

            return routeToLocalConfigured(response);
        }
    }

    /**
     * Handle action "update local docker" info
     *
     * @param {Object} request - expressjs request
     * @param {Object} response - expressjs response
     */
    function handleActionLocal(request, response) {
        if (request.user.getLocalId() == -1) {
            request.logger.error('Trying to update info in local docker when it is not configured');
            return routeToLocalNotConfigured(request, response, 'Local docker is not configured');
        }

        request.projectUtils.validateProjectActionCreateNewOrUpdateProject(true, (error) => {
            if (error === null) {
                request.nodeUtils.validateNodeActionCreateNewOrUpdate(true, (error) => {
                    if (error === null) {
                        request.projectManager.update(request.project, (error) => {
                            if (error === null) {
                                request.nodeManager.update(request.node, (error) => {
                                    if (error == null) {
                                        request.local = request.project;
                                        
                                        return routeToLocal(request, response, null, 'Info was updated');
                                    } else {
                                        return routeToLocalConfigured(
                                            response, 'Got error. Contact your system administrator'
                                        );
                                    }
                                });
                            } else {
                                return routeToLocalConfigured(response, 'Got error. Contact your system administrator');
                            }
                        });
                    } else {
                        return routeToLocal(request, response, error);
                    }
                });
            } else {
                return routeToLocal(request, response, error);
            }
        })
    }

    /**
     * Handle action "update local docker files"
     *
     * @param {Object} request - expressjs request
     * @param {Object} response - expressjs response
     */
    function handleActionFiles(request, response) {
        if (request.user.getLocalId() == -1) {
            request.logger.error('Trying to update files in local docker when it is not configured');
            return routeToLocalNotConfigured(request, response, 'Local docker is not configured');
        }

        request.projectUtils.validateProjectActionUpdateCerts((error) => {
            if (error === null) {
                request.projectManager.update(request.project, (error) => {
                    if (error === null) {
                        return routeToLocalConfigured(response, null, 'Files were changed');
                    } else {
                        return routeToLocalConfigured(response, 'Got error. Contact your system administrator');
                    }
                });
            } else {
                return routeToLocalConfigured(response, error);
            }
        });
    }

    /**
     * Update local docker info
     */
    application.getExpress().post('/profile/local/', (request, response) => {
        const   ACTION_CREATE   = 'create'; // action == create local docker
        const   ACTION_LOCAL    = 'local'; // action == update local docker info (name, port, ip, etc)
        const   ACTION_FILES    = 'files'; // action == update local docker files

        var action = request.body.action;

        if (typeof action === 'undefined') {
            request.logger.error('No action in the request');
            return routeToLocal(request, response, 'Wrong request');
        }

        switch (action) {
            case ACTION_CREATE:
                return handleActionCreate(request, response);
                break;

            case ACTION_FILES:
                return handleActionFiles(request, response);
                break;

            case ACTION_LOCAL:
                return handleActionLocal(request, response);
                break;

            default:
                request.logger.error('Wrong action [' + action + ']');
                return routeToLocal(request, response, 'Wrong action');
        }
    });

    /**
     * Delete local - handler
     */
    application.getExpress().post('/profile/local/delete/', (request, response) => {
        if (request.user.getLocalId() === -1) {
            request.logger.error('Attempt to delete local docker when it was not created');
            return routeToLocalNotConfigured(request, response, 'You don\'t have local docker');
        }

        request.nodeManager.deleteByProjectId(request.user.getLocalId(), (error) => {
            if (error === null) {
                request.projectManager.deleteProject(request.user.getLocalId(), (error) => {
                    if (error === null) {
                        request.user.setLocalId(-1);

                        request.userManager.update(request.user, (error) => {
                            if (error === null) {
                                request.project = request.projectManager.create().setUserId(request.user.getId());
                                request.node = request.nodeManager.create(-1);

                                routeToLocalNotConfigured(request, response, null, 'Local docker was deleted');
                            } else {
                                request.logger.error(error);

                                return routeToLocalConfigured(response, 'Got error. Contact your system administrator');
                            }
                        })
                    } else {
                        request.logger.error(error);

                        return routeToLocalConfigured(response, 'Got error. Contact your system administrator');
                    }
                });
            } else {
                request.logger.error(error);

                return routeToLocalConfigured(response, 'Got error. Contact your system administrator');
            }
        });
    });

    /**
     * Delete local - page
     */
    application.getExpress().get('/profile/local/delete/', (request, response) => {
        if (request.user.getLocalId() === -1) {
            request.logger.error('Attempt to delete local docker when it was not created');
            return routeToLocalNotConfigured(request, response, 'You don\'t have local docker');
        }

        return response.render('profile/local/delete.html.twig', {
            action: 'profile.local'
        });
    });

};
