"use strict";

/**
 * projects.js - user's projects
 *
 * /profile/projects/*
 *
 * Copyright (C) 2016 Anton Zagorskii aka amberovsky. All rights reserved. Contacts: <amberovsky@gmail.com>
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * View projects
     */
    application.getExpress().get('/profile/projects/', (request, response) => {
        request.projectManager.getAllForUser(request.user, (error, projects) => {
            response.render('profile/projects.html.twig', {
                action: 'profile.projects',
                projects: projects
            });
        });
    });

};
