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

    var projectManager = application.getProjectManager();

    /**
     * Create a new project - page
     */
    application.getExpress().get('/admin/projects/create/', function (request, response) {
        response.render('admin/project.html.twig', {
            action: 'admin.projects',
            project: projectManager.create(),
            subaction: 'create'
        });
    });

    /**
     * Create a new project - handler
     */
    application.getExpress().post('/admin/projects/create/', function (request, response) {
        var project = projectManager.create();

         validateProjectActionCreateNewOrUpdateProject(request, project, false, (project, error) => {
             if (error !== null) {
                 return response.render('admin/project.html.twig', {
                     action: 'admin.projects',
                     project: project,
                     error: error,
                     subaction: 'create'
                 });
             }

             projectManager.add(project, function (error) {
                 if (error !== null) {
                     response.render('admin/project.html.twig', {
                         action: 'admin.projects',
                         project: project,
                         error: 'Got error during create. Contact your system administrator.',
                         subaction: 'create'
                     });
                 } else {
                     projectManager.getAll((projects, error) => {
                         response.render('admin/projects.html.twig', {
                             action: 'admin.projects',
                             projects: projects,
                             projectsCount: Object.keys(projects).length,
                             success: 'Project [' + project.getName() + '] was created.'
                         });
                     });
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
            return response.redirect('/');
        }

        projectManager.getById(projectId, (project, error) => {
            if (project === null) {
                return response.redirect('/');
            }
            
            request.project = project;
            return next();
        });
    });

    /**
     * View all projects
     */
    application.getExpress().get('/admin/projects/', function (request, response) {
        projectManager.getAll((projects, error) => {
            response.render('admin/projects.html.twig', {
                action: 'admin.projects',
                projects: projects,
                projectsCount: Object.keys(projects).length
            });
        });
    });

    /**
     * View project
     */
    application.getExpress().get('/admin/projects/:projectId/', function (request, response) {
        if (request.project === null) {
            projectManager.getAll((projects, error) =>  {
                return response.render('admin/projects.html.twig', {
                    action: 'admin.projects',
                    projects: projects,
                    projectsCount: Object.keys(projects).length,
                    error: 'Project with given ID doesn\'t exist'
                });
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
     * @param {callback} callback - {Project, error} 
     */
    function validateProjectActionCreateNewOrUpdateProject(request, project, isUpdate, callback) {
        var name = request.body.name;

        if (typeof name === 'undefined') {
            return callback(project, 'Not enough data in the request.');
        }

        name = name.trim();

        if (name.length < projectManager.MIN_TEXT_FIELD_LENGTH) {
            return callback(project, 'Name should be at least ' + projectManager.MIN_TEXT_FIELD_LENGTH +
                ' characters.');
        }

        var projectId = (isUpdate === true) ? project.getId() : -1;

        projectManager.doesExistWithSameName(name, projectId, (check) => {
            if (check) {
                return callback(project, 'Project with name [' + name + '] already exists.');
            }

            project.setName(name);

            return callback(project, null);
        });
    };

    /**
     * Update project info
     */
    application.getExpress().post('/admin/projects/:projectId/', function (request, response) {
        if (request.project === null) {
            projectManager.getAll((projects, error) => {
                return response.render('admin/projects.html.twig', {
                    action: 'admin.projects',
                    projects: projects,
                    projectsCount: Object.keys(projects).length,
                    error: 'Project with given ID doesn\'t exist'
                });
            });
        }

        validateProjectActionCreateNewOrUpdateProject(request, request.project, true, (project, error) => {
            if (error !== null) {
                return response.render('admin/project.html.twig', {
                    action: 'admin.projects',
                    project: project,
                    subaction: 'edit',
                    error: error
                });
            }

            projectManager.update(project, function (error) {
                if (error === null) {
                    application.projectManager.getAll((projects, error) => {
                        return response.render('admin/projects.html.twig', {
                            action: 'admin.projects',
                            projects: projects,
                            projectsCount: Object.keys(projects).length,
                            success: 'Project [' + project.getName() + '] info was updated.'
                        });
                    })
                } else {
                    return response.render('admin/project.html.twig', {
                        action: 'admin.projects',
                        project: project,
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
        if (request.project === null) {
            projectManager.getAll((projects, error) => {
                return response.render('admin/projects.html.twig', {
                    action: 'admin.projects',
                    projects: projects,
                    projectsCount: Object.keys(projects).length,
                    error: 'Project with given ID doesn\'t exist'
                });
            })
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
            projectManager.getAll((projects, error) => {
                return response.render('admin/projects.html.twig', {
                    action: 'admin.projects',
                    projects: projects,
                    projectsCount: Object.keys(projects).length,
                    error: 'Project with given ID doesn\'t exist'
                });
            });
        }

        projectManager.deleteProject(request.project.getId(), function (error) {
            if (error === null) {
                projectManager.getAll((projects, error) => {
                    return response.render('admin/projects.html.twig', {
                        action: 'admin.projects',
                        projects: projects,
                        projectsCount: Object.keys(projects).length,
                        success: 'Project [' + request.project.getName() + '] was deleted.'
                    });
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
