"use strict";

/**
 * settings.js - project settings
 *
 * /project/:projectId/settings/* 
 * 
 * (C) Anton Zagorskii aka amberovsky amberovsky@gmail.com
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * View project settings
     */
    application.getExpress().get('/project/:projectId/settings/', function (request, response) {
        if (!request.isUserAdminForThisProject) {
            return response.redirect('/');
        }

        request.projectLogManager.getAllForProject(request.project.getId(), (error, projectLogs) => {
            if (error === null) {
                response.render('project/settings.html.twig', {
                    action: 'project.settings',
                    projectLogs: projectLogs
                });
            } else {
                request.logger.error(error);

                response.render('project/settings.html.twig', {
                    action: 'project.settings',
                    projectLogs: {},
                    error: 'Got error. Contact your system administrator'
                });
            }
        });
    });
    
};
