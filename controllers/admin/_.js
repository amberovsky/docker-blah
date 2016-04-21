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

    application.getExpress().all('/admin/*', function(request, response, next) {
        if (
            (!application.getDockerBlah().getUserManager().isUserAdmin(request.currentUser)) &&
            (!application.getDockerBlah().getUserManager().isUserSuper(request.currentUser))
        ) {
            return response.redirect('/');
        }

        return next();
    });
    
};
