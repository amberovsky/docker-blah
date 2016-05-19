"use strict";

/**
 * projects.js - user's projects
 *
 * /profile/projects/*
 *
 * (C) Anton Zagorskii aka amberovsky amberovsky@gmail.com
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * View projects
     */
    application.getExpress().get('/profile/projects/', function (request, response) {
        request.projectManager.getAllForUser(request.user, (error, projects) => {
            response.render('profile/projects.html.twig', {
                action: 'profile.projects',
                projects: projects
            });
        });
    });

};
