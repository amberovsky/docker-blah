"use strict";

/**
 * index.js - main pages
 *
 * /
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    application.getExpress().get('/', function (request, response) {
        response.render('index/index.html.twig', {
            action: 'index.index'
        });
    });
    
};
