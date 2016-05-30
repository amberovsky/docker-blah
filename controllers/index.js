"use strict";

/**
 * index.js - main pages
 *
 * /
 *
 * Copyright (C) 2016 Anton Zagorskii aka amberovsky. All rights reserved. Contacts: <amberovsky@gmail.com>
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * Project entrypoint
     */
    application.getExpress().get('/', (request, response) => {
        response.render('index/index.html.twig', {
            action: 'index.index'
        });
    });
    
};
