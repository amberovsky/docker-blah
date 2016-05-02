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

        response.render('admin/project/project.html.twig', {
            action: 'admin.projects',
            subaction: 'create'
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
        request.projectManager.getAll((getAllError, projects) => {
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

         validateProjectActionCreateNewOrUpdateProject(request, false, (error) => {
             if (error !== null) {
                 return response.render('admin/project/project.html.twig', {
                     action: 'admin.projects',
                     error: error,
                     subaction: 'create'
                 });
             }

             request.projectManager.add(request.project, function (error) {
                 if (error !== null) {
                     response.render('admin/project/project.html.twig', {
                         action: 'admin.projects',
                         error: 'Got error during create. Contact your system administrator.',
                         subaction: 'create'
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
     * Validate request for create new project or update existing
     * 
     * @param {Object} request - express request
     * @param {boolean} isUpdate - is it update operation or create new
     * @param {DatabaseOperationCallback} callback - database operation callback
     */
    function validateProjectActionCreateNewOrUpdateProject(request, isUpdate, callback) {
        var name = request.body.name;

        request.project.setName(name);

        if (typeof name === 'undefined') {
            return callback('Not enough data in the request.');
        }

        name = name.trim();

        if (name.length < request.projectManager.MIN_TEXT_FIELD_LENGTH) {
            return callback('Name should be at least ' + request.projectManager.MIN_TEXT_FIELD_LENGTH + ' characters.');
        }

        var projectId = (isUpdate === true) ? request.project.getId() : -1;

        request.projectManager.doesExistWithSameName(name, projectId, (error, check) => {
            if (check) {
                return callback('Project with name [' + name + '] already exists.');
            }

            request.project.setName(name);

            return callback(null);
        });
    };

    /**
     * Update project info
     */
    application.getExpress().post('/admin/projects/:projectId/', function (request, response) {
        validateProjectActionCreateNewOrUpdateProject(request, true, (error) => {
            if (error !== null) {
                return response.render('admin/project/project.html.twig', {
                    action: 'admin.projects',
                    subaction: 'edit',
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
                    return response.render('admin/project/project.html.twig', {
                        action: 'admin.projects',
                        subaction: 'edit',
                        error: 'Got error during update. Contact your system administrator.'
                    });
                }
            });

        });
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
                return routeToAllProjects(
                    request, response, null, 'Got error during update. Contact your system administrator.'
                );
            }
        });
    });

};
