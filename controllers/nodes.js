"use strict";

/**
 * nodes.js - action with nodes inside project // TODO possible move to project
 *
 * /project/:projectId/nodes/*
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * View all nodes
     */
    application.getExpress().get('/project/:projectId/node/', function (request, response) {
        response.render('nodes/index.html.twig', {
            nodes: {}
        });
    });
    
};
