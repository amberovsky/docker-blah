"use strict";

/**
 * logs.js - admin actions about logs
 * 
 * /admin/logs/*
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function(application) {

    /**
     * Middleware to detect log in the url
     */
    application.getExpress().all('/admin/logs/:log/*/', function (request, response, next) {
        request.log = request.params.log;

        if (
            (typeof request.log === 'undefined') ||
            ((request.log !== 'http') && (request.log !== 'system'))
        ) {
            response.redirect('/admin/logs/http/');
        } else {
            next();
        }
    });

    /**
     * Wipe log
     */
    application.getExpress().get('/admin/logs/:log/wipe/', function (request, response) {
        var fs = require('fs');

        fs.truncate(application.getLogsDirectory() + request.log + '.log', 0, function () {
            application.getSystemLogger().info('log was truncated by [' + request.user.getId() + '] - [' +
                request.user.getName() + ']');

            return response.render('admin/logs.html.twig', {
                action: 'admin.logs',
                log: request.log
            });
        });
    });

    /**
     * Download log
     */
    application.getExpress().get('/admin/logs/:log/download/', function (request, response) {
        response.download(
            application.getLogsDirectory() + request.log + '.log',
            'docker-blah.' + request.log + '.log'
        );
    });

    /**
     * View log
     */
    application.getExpress().get('/admin/logs/:log/', function (request, response) {
        response.render('admin/logs.html.twig', {
            action: 'admin.logs',
            log: request.log
        });
    });

    /**
     * View log
     */
    application.getExpress().get('/admin/logs/:log/', function (request, response) {
        response.render('admin/logs.html.twig', {
            action: 'admin.logs',
            log: request.log
        });
    });
    
};
