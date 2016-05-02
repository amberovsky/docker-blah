"use strict";

/**
 * project.js - project overview
 *
 * /project/:projectId/
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {
    
    /**
     * Project overview
     */
    application.getExpress().get('/project/:projectId/', function (request, response) {
        response.render('project/index.html.twig', {
            action: 'project.index'
        });
    });

};
