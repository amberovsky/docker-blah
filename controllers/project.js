"use strict";

/**
 * project.js - project overview
 *
 * /project/:projectId/
 *
 * Copyright (C) 2016 Anton Zagorskii aka amberovsky. All rights reserved. Contacts: <amberovsky@gmail.com>
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {
    
    /**
     * Overview
     */
    application.getExpress().get('/project/:projectId/overview', (request, response) => {
        request.userManager.searchByCriteria(-1, request.project.getId(), -1, (error, data) => {
            response.render('project/overview.html.twig', {
                action: 'project.index',
                users: data.users,
                roles: data.roles
            });
        });
    });

};
