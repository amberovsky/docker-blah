"use strict";

/**
 * _.js - access restriction for admin actions. Has to be included first!
 *
 * /admin/* 
 *
 * (C) Anton Zagorskii aka amberovsky amberovsky@gmail.com
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * Middleware to check permissions for /admin/* section
     */
    application.getExpress().all('/admin/*', (request, response, next) => {
        if ((!request.userManager.isUserAdmin(request.user)) && (!request.userManager.isUserSuper(request.user))) {
            request.logger.error('access to admin area without admin or super privileges');

            return response.redirect('/');
        }

        return next();
    });
    
};
