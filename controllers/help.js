"use strict";

/**
 * help.js - help section
 * 
 * /help/*
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    application.getExpress().get('/help/', function (request, response) {
        response.render('help/index.html.twig', {
            action: 'help.index'
        });
    });
    
};
