"use strict";

/**
 * admin.js - admin actions, not so important to be in a separate file
 *
 * /admin/*
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    application.getExpress().get('/admin/events/', function (request, response) {
        response.render('admin/events.html.twig', {
            action: 'admin.events'
        });
    });

    application.getExpress().get('/admin/settings', function (request, response) {
        response.render('admin/settings.html.twig', {
            action: 'admin.settings'
        });
    });
    
};
