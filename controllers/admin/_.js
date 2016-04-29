"use strict";

/**
 * _.js - access restriction for admin actions. Has to be included first!
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * Middleware to check permissions for /admin/* section
     */
    application.getExpress().all('/admin/*', function (request, response, next) {
        if ((!request.userManager.isUserAdmin(request.user)) && (!request.userManager.isUserSuper(request.user))) {
            return response.redirect('/');
        }

        return next();
    });
    
};
