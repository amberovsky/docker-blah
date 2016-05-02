"use strict";

/**
 * containers.js - project containers
 *
 * /project/:projectId/containers/* 
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * View containers in project
     */
    application.getExpress().get('/project/:projectId/containers/', function (request, response) {
        response.render('project/containers.html.twig', {
            action: 'project.containers'
        });
    });
    
};
