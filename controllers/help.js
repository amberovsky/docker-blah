"use strict";

/**
 * help.js - help section
 * 
 * /help/*
 *
 * Copyright (C) 2016 Anton Zagorskii aka amberovsky. All rights reserved. Contacts: <amberovsky@gmail.com>
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * Help start page
     */
    application.getExpress().get('/help/', (request, response) => {
        response.render('help/index.html.twig', {
            action: 'help.index'
        });
    });
    
};
