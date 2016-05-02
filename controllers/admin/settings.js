"use strict";

/**
 * settings.js - admin settings
 *
 * /admin/settings/*
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * View all settings
     */
    application.getExpress().get('/admin/settings', function (request, response) {
        response.render('admin/settings.html.twig', {
            action: 'admin.settings'
        });
    });
    
};
