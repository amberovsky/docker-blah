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
     * Overview
     */
    application.getExpress().get('/project/:projectId/overview', function (request, response) {
        request.userManager.searchByCriteria(-1, request.project.getId(), -1, (error, data) => {
            console.log(data);
            response.render('project/overview.html.twig', {
                action: 'project.index',
                users: data.users,
                roles: data.roles
            });
        });
    });

};
