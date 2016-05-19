"use strict";

/**
 * index.js - main pages
 *
 * /
 *
 * (C) Anton Zagorskii aka amberovsky amberovsky@gmail.com
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * Project entrypoint
     */
    application.getExpress().get('/', function (request, response) {
        response.render('index/index.html.twig', {
            action: 'index.index'
        });
    });
    
};
