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
    
    var dockerBlah = application.getDockerBlah();

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
            (name.length < dockerBlah.getUserManager().MIN_TEXT_FIELD_LENGTH) ||
            (login.length < dockerBlah.getUserManager().MIN_TEXT_FIELD_LENGTH)
        ) {
            return 'Name and login should be at least ' + dockerBlah.getUserManager().MIN_TEXT_FIELD_LENGTH +
                ' characters.';
        }

        request.currentUser
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
            (newPassword.length < dockerBlah.getUserManager().MIN_TEXT_FIELD_LENGTH) ||
            (newPassword2.length < dockerBlah.getUserManager().MIN_TEXT_FIELD_LENGTH)
        ) {
            return 'Passwords should be at least ' + dockerBlah.getUserManager().MIN_TEXT_FIELD_LENGTH +
                ' characters.';
        }

        if (newPassword !== newPassword2) {
            return 'New passwords do not match.';
        }

        if (
            !dockerBlah.getAuth().checkPasswordMatch(request.currentUser.getPasswordHash(), currentPassword)
        ) {
            return 'Wrong current password';
        }

        request.currentUser.setPasswordHash(dockerBlah.getAuth().hashPassword(newPassword));

        return true;
    };

    /**
     * View profile - handler
     */
    application.getExpress().post('/profile/personal/', function(request, response) {
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
        var currentUser = request.currentUser;

        if (action === ACTION_PERSONAL) {
            var validation = validateActionPersonalUpdate(request, request.currentUser);
            if (validation !== true) {
                return response.render('profile/personal.html.twig', {
                    action: 'profile.personal',
                    error_profile: validation
                });
            }

            dockerBlah.getUserManager().update(request.currentUser, function (error) {
                if (error === null) {
                    response.render('profile/personal.html.twig', {
                        action: 'profile.personal',
                        success_profile: 'Profile was updated.'
                    });
                } else {
                    request.currentUser = currentUser;
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
            
            dockerBlah.getUserManager().update(request.currentUser, function (error) {
                if (error === null) {
                    response.render('profile/personal.html.twig', {
                        action: 'profile.personal',
                        success_password: 'Password was changed.'
                    });
                } else {
                    request.currentUser = currentUser;
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
            projects: dockerBlah.getProjectManager().getAllForUser(request.currentUser)
        });
    });

};
