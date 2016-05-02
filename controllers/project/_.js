"use strict";

/**
 * _.js - access restriction and preloading for projects. Has to be included first!
 *
 * /project/:projectId/* 
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * Middleware to preload project if there is a projectId in the url
     */
    application.getExpress().all('/project/:projectId/*', function (request, response, next) {
        var projectId = parseInt(request.params.projectId);

        if (Number.isNaN(projectId)) {
            return response.redirect('/');
        }

        request.projectManager.getById(projectId, (error, project) => {
            if (project !== null) {
                request.project = project;

                if (request.userManager.isUserUser(request.user)) {
                    if (!request.projectsWithAccess.hasOwnProperty(project.getId())) {
                        response.logger.error('user [' + request.user.getId() + '] tried to access project [' +
                            project.getId() + '] where he doesn\'t have access.');

                        return response.redirect('/');
                    }

                    request.isUserAdminForThisProject =
                        (request.projectsWithAccess[project.getId()].role == request.projectManager.ROLE_ADMIN);

                    return next();
                } else {
                    request.isUserAdminForThisProject = true;
                    return next();
                }
            } else {
                return response.redirect('/');
            }
        });
    });

};
