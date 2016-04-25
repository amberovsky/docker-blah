"use strict";

/**
 * profile.js - user profile actions
 *
 * /profile/*
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * View profile - page
     */
    application.getExpress().get('/profile/personal/', function (request, response) {
        response.render('profile/personal.html.twig', {
            action: 'profile.personal'
        });
    });

    /**
     * Validate request for update user personal data
     * 
     * @param {Object} request - express request
     *
     * @returns {(boolean|string)} - true, if validation passed, error message otherwise
     */
    function validateActionPersonalUpdate(request) {
        var
            name = request.body.name,
            login = request.body.login;

        if ((typeof name === 'undefined') || (typeof login === 'undefined')) {
            return 'Not enough data in the request.';
        }

        name = name.trim();
        login = login.trim();

        if (
            (name.length < application.getUserManager().MIN_TEXT_FIELD_LENGTH) ||
            (login.length < application.getUserManager().MIN_TEXT_FIELD_LENGTH)
        ) {
            return 'Name and login should be at least ' + application.getUserManager().MIN_TEXT_FIELD_LENGTH +
                ' characters.';
        }

        request.user
            .setName(name)
            .setLogin(login);

        return true;
    };

    /**
     * Validate request for update user password
     *
     * @param {Object} request - express request
     *
     * @returns {(boolean|string)} - true, if validation passed, error message otherwise
     */
    function validateActionPasswordUpdate(request) {
        var
            currentPassword = request.body.password,
            newPassword = request.body.new_password1,
            newPassword2 = request.body.new_password2;

        if (
            (typeof currentPassword === 'undefined') ||
            (typeof newPassword === 'undefined') ||
            (typeof newPassword2 === 'undefined')
        ) {
            return 'Not enough data in the request.';
        }

        currentPassword = currentPassword.trim();
        newPassword = newPassword.trim();
        newPassword2 = newPassword2.trim();

        if (
            (newPassword.length < application.getUserManager().MIN_TEXT_FIELD_LENGTH) ||
            (newPassword2.length < application.getUserManager().MIN_TEXT_FIELD_LENGTH)
        ) {
            return 'Passwords should be at least ' + application.getUserManager().MIN_TEXT_FIELD_LENGTH +
                ' characters.';
        }

        if (newPassword !== newPassword2) {
            return 'New passwords do not match.';
        }

        if (
            !application.getAuth().checkPasswordMatch(request.user.getPasswordHash(), currentPassword)
        ) {
            return 'Wrong current password';
        }

        request.user.setPasswordHash(application.getAuth().hashPassword(newPassword));

        return true;
    };

    /**
     * View profile - handler
     */
    application.getExpress().post('/profile/personal/', function (request, response) {
        const   ACTION_PERSONAL = 'personal';
        const   ACTION_PASSWORD = 'password';

        var action = request.body.action;

        if (typeof action === 'undefined') {
            return response.render('profile/personal.html.twig', {
                action: 'profile.personal',
                error_profile: 'Wrong request.'
            });
        }

        /** @type {User} */
        var currentUser = request.user;

        if (action === ACTION_PERSONAL) {
            var validation = validateActionPersonalUpdate(request, request.user);
            if (validation !== true) {
                return response.render('profile/personal.html.twig', {
                    action: 'profile.personal',
                    error_profile: validation
                });
            }

            application.getUserManager().update(request.user, function (error) {
                if (error === null) {
                    response.render('profile/personal.html.twig', {
                        action: 'profile.personal',
                        success_profile: 'Profile was updated.'
                    });
                } else {
                    request.user = currentUser;
                    response.render('profile/personal.html.twig', {
                        action: 'profile.personal',
                        error_profile: 'Got error during update. Contact your system administrator.'
                    });
                }
            });
        } else if (action === ACTION_PASSWORD) { // if (action === ACTION_PROFILE) {
            var validation = validateActionPasswordUpdate(request);
            if (validation !== true) {

                return response.render('profile/personal.html.twig', {
                    action: 'profile.personal',
                    error_password: validation
                });
            }

            application.getUserManager().update(request.user, function (error) {
                if (error === null) {
                    response.render('profile/personal.html.twig', {
                        action: 'profile.personal',
                        success_password: 'Password was changed.'
                    });
                } else {
                    request.user = currentUser;
                    response.render('profile/personal.html.twig', {
                        action: 'profile.personal',
                        error_password: 'Got error during update. Contact your system administrator.'
                    });
                }
            });

        } else { // } else if (action === ACTION_PASSWORD) { // if (action === ACTION_PROFILE) {
            response.render('profile/personal.html.twig', {
                action: 'profile.personal',
                error_profile: 'Wrong request 2.' + action
            });
        }
    });

    /**
     * View projects
     */
    application.getExpress().get('/profile/projects/', function (request, response) {
        response.render('profile/projects.html.twig', {
            action: 'profile.projects',
            projects: application.getProjectManager().getAllForUser(request.user)
        });
    });

};
