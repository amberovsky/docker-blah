"use strict";

/**
 * users.js - admin actions about events
 * 
 * /admin/events/*
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function(application) {

    var dockerBlah = application.getDockerBlah();

    /**
     * Middleware to detect event in the url
     */
    application.getExpress().all('/admin/events/:event/*/', function (request, response, next) {
        request.event = request.params.event;

        if (
            (typeof request.event === 'undefined') ||
            ((request.event !== 'http') && (request.event !== 'system'))
        ) {
            response.redirect('/admin/events/http/');
        } else {
            next();
        }
    });

    /**
     * Clear event
     */
    application.getExpress().post('/admin/events/:event/clear/', function (request, response) {
        var fs = require('fs');

        fs.truncateSync(application.getEventsDirectory() + request.event + '.log', 0);

        response.render('admin/events.html.twig', {
            action: 'admin.events',
            subaction: request.event
        });
    });

    /**
     * Download event
     */
    application.getExpress().get('/admin/events/:event/download/', function (request, response) {
        response.download(application.getEventsDirectory() + request.event + '.log', 'docker-blah.' + event + '.log');
    });

    /**
     * View event
     */
    application.getExpress().get('/admin/events/:event/', function (request, response) {
        response.render('admin/events.html.twig', {
            action: 'admin.events',
            subaction: request.event
        });
    });

};
