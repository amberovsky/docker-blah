"use strict";

/**
 * _.js - access restriction and preloading for projects. Has to be included first!
 *
 * /project/:projectId/* 
 *
 * (C) Anton Zagorskii aka amberovsky amberovsky@gmail.com
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * Middleware to preload project if there is a projectId in the url
     */
    application.getExpress().all('/project/:projectId/*', (request, response, next) => {
        var projectId = parseInt(request.params.projectId);

        if (Number.isNaN(projectId)) {
            return response.redirect('/');
        }

        if (request.userManager.isUserUser(request.user) && (request.user.getLocalId() !== projectId)) {
            if (!request.projectsWithAccess.hasOwnProperty(projectId)) {
                request.logger.error('user [' + request.user.getId() + '] tried to access project [' + projectId +
                    '] where he doesn\'t have access.');

                return response.redirect('/');
            }

            request.project = request.projectsWithAccess[projectId].project;
            request.isUserAdminForThisProject =
                (request.projectsWithAccess[projectId].role == request.projectManager.ROLE_ADMIN);

            return next();
        } else {
            request.projectManager.getById(projectId, (error, project) => {
                if (error === null) {
                    request.project = project;

                    request.isUserAdminForThisProject = true;
                    return next();

                } else {
                    request.logger.error('Request to non-existed project [' + projectId + ']');
                    return response.redirect('/');
                }
            });
        }
    });

};
