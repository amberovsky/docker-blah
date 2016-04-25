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
        response.render('admin/project.html.twig', {
            action: 'admin.projects',
            project: application.getProjectManager().create(),
            subaction: 'create'
        });
    });

    /**
     * Create a new project - handler
     */
    application.getExpress().post('/admin/projects/create/', function (request, response) {
        var
            project = application.getProjectManager().create(),
            validation = validateProjectActionCreateNewOrUpdateProject(request, project, false);

        if (validation !== true) {
            return response.render('admin/project.html.twig', {
                action: 'admin.projects',
                project: project,
                error: validation,
                subaction: 'create'
            });
        }

        application.getProjectManager().add(project, function (error) {
            if (error !== null) {
                response.render('admin/project.html.twig', {
                    action: 'admin.projects',
                    project: project,
                    error: 'Got error during create. Contact your system administrator.',
                    subaction: 'create'
                });
            } else {
                var projects = application.getProjectManager().getAll();

                response.render('admin/projects.html.twig', {
                    action: 'admin.projects',
                    projects: projects,
                    projectsCount: Object.keys(projects).length,
                    success: 'Project [' + project.getName() + '] was created.'
                });
            }
        });
    });

    /**
     * Middleware to preload project if there is a projectId in the url
     */
    application.getExpress().all('/admin/projects/:projectId/*', function (request, response, next) {
        request.projectId = parseInt(request.params.projectId);
        request.project = Number.isNaN(request.projectId)
            ? null
            : application.getProjectManager().getById(request.projectId);

        next();
    });

    /**
     * View all projects
     */
    application.getExpress().get('/admin/projects/', function (request, response) {
        var projects = application.getProjectManager().getAll();
        
        response.render('admin/projects.html.twig', {
            action: 'admin.projects',
            projects: projects,
            projectsCount: Object.keys(projects).length
        });
    });

    /**
     * View project
     */
    application.getExpress().get('/admin/projects/:projectId/', function (request, response) {
        if (request.project === null) {
            var projects = application.getProjectManager().getAll();

            return response.render('admin/projects.html.twig', {
                action: 'admin.projects',
                projects: projects,
                projectsCount: Object.keys(projects).length,
                error: 'Project with given ID doesn\'t exist'
            });
        }

        response.render('admin/project.html.twig', {
            action: 'admin.projects',
            project: request.project
        });
    });

    /**
     * Validate request for create new project or update existing
     * 
     * @param {Object} request - express request
     * @param {Project} project - new/existing project
     * @param {boolean} isUpdate - is it update operation or create new
     * 
     * @returns {(boolean|string)} - true, if validation passed, error message otherwise
     */
    function validateProjectActionCreateNewOrUpdateProject(request, project, isUpdate) {
        var name = request.body.name;

        if (typeof name === 'undefined') {
            return 'Not enough data in the request.';
        }

        name = name.trim();

        if (name.length < application.getProjectManager().MIN_TEXT_FIELD_LENGTH) {
            return 'Name should be at least ' + application.getProjectManager().MIN_TEXT_FIELD_LENGTH +
                ' characters.';
        }

        if (application.getProjectManager().getByName(name, (isUpdate === true) ? project.getId() : -1) !== null) {
            return 'Project with name [' + name + '] already exists.';
        }

        project.setName(name);

        return true;
    };

    /**
     * Update project info
     */
    application.getExpress().post('/admin/projects/:projectId/', function (request, response) {
        if (request.project === null) {
            var projects = application.getProjectManager().getAll();

            return response.render('admin/projects.html.twig', {
                action: 'admin.projects',
                projects: projects,
                projectsCount: Object.keys(projects).length,
                error: 'Project with given ID doesn\'t exist'
            });
        }

        var validation = validateProjectActionCreateNewOrUpdateProject(request, request.project, true);

        if (validation !== true) {
            return response.render('admin/project.html.twig', {
                action: 'admin.projects',
                project: request.project,
                subaction: 'edit',
                error: validation
            });
        }

        application.getProjectManager().update(request.project, function (error) {
            if (error === null) {
                var projects = application.getProjectManager().getAll();

                return response.render('admin/projects.html.twig', {
                    action: 'admin.projects',
                    projects: projects,
                    projectsCount: Object.keys(projects).length,
                    success: 'Project [' + request.project.getName() + '] info was updated.'
                });
            } else {
                return response.render('admin/project.html.twig', {
                    action: 'admin.projects',
                    project: request.project,
                    subaction: 'edit',
                    error: 'Got error during update. Contact your system administrator.'
                });
            }
        });
    });

    /**
     * Delete project - page
     */
    application.getExpress().get('/admin/projects/:projectId/delete/', function (request, response) {
        if (request.project === null) {
            var projects = application.getProjectManager().getAll();

            return response.render('admin/projects.html.twig', {
                action: 'admin.projects',
                projects: projects,
                projectsCount: Object.keys(projects).length,
                error: 'Project with given ID doesn\'t exist'
            });
        }

        response.render('admin/project.delete.html.twig', {
            action: 'admin.projects'
        });
    });

    /**
     * Delete project - handler
     */
    application.getExpress().post('/admin/projects/:projectId/delete/', function (request, response) {
        if (request.project === null) {
            var projects = application.getProjectManager().getAll();

            return response.render('admin/projects.html.twig', {
                action: 'admin.projects',
                projects: projects,
                projectsCount: Object.keys(projects).length,
                error: 'Project with given ID doesn\'t exist'
            });
        }

        application.getProjectManager().deleteProject(request.project.getId(), function (error) {
            if (error === null) {
                var projects = application.getProjectManager().getAll();

                return response.render('admin/projects.html.twig', {
                    action: 'admin.projects',
                    projects: projects,
                    projectsCount: Object.keys(projects).length,
                    success: 'Project [' + request.project.getName() + '] was deleted.'
                });
            } else {
                return response.render('admin/projects.html.twig', {
                    action: 'admin.projects',
                    projects: projects,
                    projectsCount: Object.keys(projects).length,
                    error: 'Got error during update. Contact your system administrator.'
                });
            }
        });
    });

};
