"use strict";

/**
 * settings.js - project settings
 *
 * /project/:projectId/settings/* 
 * 
 * (C) Anton Zagorskii aka amberovsky
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

        response.render('project/settings.html.twig', {
            action: 'project.settings'
        });
    });
    
};
