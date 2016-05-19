"use strict";

/**
 * help.js - help section
 * 
 * /help/*
 *
 * (C) Anton Zagorskii aka amberovsky amberovsky@gmail.com
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * Help start page
     */
    application.getExpress().get('/help/', function (request, response) {
        response.render('help/index.html.twig', {
            action: 'help.index'
        });
    });
    
};
