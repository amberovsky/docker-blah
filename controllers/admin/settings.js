"use strict";

/**
 * settings.js - admin settings
 *
 * /admin/settings/*
 *
 * Copyright (C) 2016 Anton Zagorskii aka amberovsky. All rights reserved. Contacts: <amberovsky@gmail.com>
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * View all settings
     */
    application.getExpress().get('/admin/settings', (request, response) => {
        response.render('admin/settings.html.twig', {
            action: 'admin.settings'
        });
    });
    
};
