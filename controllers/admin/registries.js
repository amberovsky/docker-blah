"use strict";

/**
 * registries.js - admin actions about registries
 * 
 * /admin/registries/*
 *
 * (C) Anton Zagorskii aka amberovsky amberovsky@gmail.com
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * Create a new registry - page
     */
    application.getExpress().get('/admin/registries/create/', function (request, response) {
        request.registry = request.registryManager.create();

        response.render('admin/registry/registry.html.twig', {
            action: 'admin.registries',
            subaction: 'create'
        });
    });


    /**
     * Renders template for all registries
     *
     * @param {Object} request - expressjs request
     * @param {Object} response - expressjs response
     * @param {(string|null)} success - success message, if present
     * @param {(string|null)} error - error message, if present
     */
    function routeToAllRegistries(request, response, success, error) {
        request.registryManager.getAll((getAllError, registries) => {
            response.render('admin/registry/registries.html.twig', {
                action: 'admin.registries',
                registries: registries,
                registriesCount: Object.keys(registries).length,
                success: success,
                error: error
            });
        });
    };

    /**
     * View all registries
     */
    application.getExpress().get('/admin/registries/', function (request, response) {
        return routeToAllRegistries(request, response, null, null);
    });

};
