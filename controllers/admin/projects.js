"use strict";

/**
 * projects.js - admin actions about projects
 * 
 * /admin/projects/*
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {
    
    /**
     * Create a new project - page
     */
    application.getExpress().get('/admin/projects/create/', function (request, response) {
        request.project = request.projectManager.create();

        response.render('admin/project/project.create.html.twig', {
            action: 'admin.projects'
        });
    });

    /**
     * Renders template for all projects
     *
     * @param {Object} request - expressjs request
     * @param {Object} response - expressjs response
     * @param {(string|null)} success - success message, if present
     * @param {(string|null)} error - error message, if present
     */
    function routeToAllProjects(request, response, success, error) {
        request.projectManager.getAllExceptLocal((getAllError, projects) => {
            response.render('admin/project/projects.html.twig', {
                action: 'admin.projects',
                projects: projects,
                projectsCount: Object.keys(projects).length,
                success: success,
                error: error
            });
        });
    };

    /**
     * Create a new project - handler
     */
    application.getExpress().post('/admin/projects/create/', function (request, response) {
        request.project = request.projectManager.create();

         request.projectUtils.validateProjectActionCreateNewOrUpdateProject(false, (error) => {
             if (error !== null) {
                 return response.render('admin/project/project.create.html.twig', {
                     action: 'admin.projects',
                     error: error
                 });
             }

             request.projectManager.add(request.project, function (error) {
                 if (error !== null) {
                     request.logger.error(error);
                     
                     response.render('admin/project/project.create.html.twig', {
                         action: 'admin.projects',
                         error: 'Got error. Contact your system administrator.'
                     });
                 } else {
                     request.logger.info('new project [' + request.project.getName() + '] was created');

                     return routeToAllProjects(
                         request, response, 'Project [' + request.project.getName() + '] was created.', null
                     );
                 }
             });
         });
    });
    
    /**
     * Middleware to preload project if there is a projectId in the url
     */
    application.getExpress().all('/admin/projects/:projectId/*', function (request, response, next) {
        var projectId = parseInt(request.params.projectId);

        if (Number.isNaN(projectId)) {
            request.logger.info('project was requested by non-NAN id [' + projectId + ']');

            return routeToAllProjects(request, response, null, 'Wrong project id');
        }

        request.projectManager.getById(projectId, (error, project) => {
            if (project === null) {
                request.logger.info('non-existed project [' + projectId + '] was requested');

                return routeToAllProjects(request, response, null, 'Project with given id doesn\'t exist');
            }

            if (project.getUserId() != -1) {
                request.logger.info('local docker as project [' + projectId + '] was requested in admin');

                return routeToAllProjects(request, response, null, 'Project with given id doesn\'t exist');
            }
            
            request.project = project;
            return next();
        });
    });

    /**
     * View all projects
     */
    application.getExpress().get('/admin/projects/', function (request, response) {
        return routeToAllProjects(request, response, null, null);
    });

    /**
     * View/Edit project
     */
    application.getExpress().get('/admin/projects/:projectId/', function (request, response) {
        response.render('admin/project/project.html.twig', {
            action: 'admin.projects'
        });
    });

    /**
     * Handle action "update project files"
     *
     * @param {Object} request - expressjs request
     * @param {Object} response - expressjs response
     */
    function handleActionFiles(request, response) {
        request.projectUtils.validateProjectActionUpdateCerts((error) => {
            if (error === null) {
                request.projectManager.update(request.project, (error) => {
                    if (error === null) {
                        return routeToAllProjects(
                            request, response, 'Project [' + request.project.getName() + '] files were updated.', null
                        );
                    } else {
                        return response.render('admin/project/project.html.twig', {
                            action: 'admin.projects',
                            error: 'Got error. Contact your system administrator'
                        });
                    }
                });
            } else {
                return response.render('admin/project/project.html.twig', {
                    action: 'admin.projects',
                    error: error
                });
            }
        });
    }

    /**
     * Handle action "update project info"
     *
     * @param {Object} request - expressjs request
     * @param {Object} response - expressjs response
     */
    function handleActionInfo(request, response) {
        request.projectUtils.validateProjectActionCreateNewOrUpdateProject(true, (error) => {
            if (error !== null) {
                return response.render('admin/project/project.html.twig', {
                    action: 'admin.projects',
                    error: error
                });
            }

            request.projectManager.update(request.project, function (error) {
                if (error === null) {
                    request.logger.info('project [' + request.project.getName() + '] was updated.');

                    return routeToAllProjects(
                        request, response, 'Project [' + request.project.getName() + '] info was updated.', null
                    );
                } else {
                    request.logger.error(error);
                    
                    return response.render('admin/project/project.html.twig', {
                        action: 'admin.projects',
                        error: 'Got error. Contact your system administrator.'
                    });
                }
            });

        });
    }

    /**
     * Update project info
     */
    application.getExpress().post('/admin/projects/:projectId/', function (request, response) {
        const   ACTION_INFO     = 'info'; // action == update project info (name, etc)
        const   ACTION_FILES    = 'files'; // action == update project files

        var action = request.body.action;

        if (typeof action === 'undefined') {
            request.logger.error('No action in the request');
            return response.render('admin/project/project.html.twig', {
                action: 'admin.projects',
                error: 'Wrong request'
            });
        }

        switch (action) {
            case ACTION_FILES:
                return handleActionFiles(request, response);
                break;

            case ACTION_INFO:
                return handleActionInfo(request, response);
                break;

            default:
                request.logger.error('Wrong action [' + action + ']');

                return response.render('admin/project/project.html.twig', {
                    action: 'admin.projects',
                    error: 'Wrong request'
                });
        }
    });

    /**
     * Delete project - page
     */
    application.getExpress().get('/admin/projects/:projectId/delete/', function (request, response) {
        response.render('admin/project/delete.html.twig', {
            action: 'admin.projects'
        });
    });

    /**
     * Delete project - handler
     */
    application.getExpress().post('/admin/projects/:projectId/delete/', function (request, response) {
        request.projectManager.deleteProject(request.project.getId(), function (error) {
            if (error === null) {
                request.logger.info('project [' + request.project.getName() + '] was deleted.');

                return routeToAllProjects(
                    request, response, 'Project [' + request.project.getName() + '] was deleted.', null
                );
            } else {
                request.logger.error(error);
                
                return routeToAllProjects(
                    request, response, null, 'Got error. Contact your system administrator.'
                );
            }
        });
    });

};
