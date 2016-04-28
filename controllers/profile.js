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
    
    var
        userManager = application.getUserManager(),
        projectManager = application.getProjectManager();

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
     * @param {callback} callback - {User, error}
     */
    function validateActionPersonalUpdate(request, callback) {
        var
            name = request.body.name,
            login = request.body.login;

        if ((typeof name === 'undefined') || (typeof login === 'undefined')) {
            return callback(request.user, 'Not enough data in the request.');
        }

        name = name.trim();
        login = login.trim();

        if ((name.length < userManager.MIN_TEXT_FIELD_LENGTH) || (login.length < userManager.MIN_TEXT_FIELD_LENGTH)) {
            return callback(
                request.user,
                'Name and login should be at least ' + userManager.MIN_TEXT_FIELD_LENGTH + ' characters.'
            );
        }

        userManager.getByLogin(login, request.user.getId(), (foundUser, error) => {
            if (foundUser !== null) {
                return callback(request.user, 'User with login [' + login + '] already exists.');
            }

            request.user
                .setName(name)
                .setLogin(login);

            return callback(request.user, null);
        });
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
            (newPassword.length < userManager.MIN_TEXT_FIELD_LENGTH) ||
            (newPassword2.length < userManager.MIN_TEXT_FIELD_LENGTH)
        ) {
            return 'Passwords should be at least ' + userManager.MIN_TEXT_FIELD_LENGTH + ' characters.';
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
            validateActionPersonalUpdate(request, (user, error) => {
                if (error !== null) {
                    return response.render('profile/personal.html.twig', {
                        action: 'profile.personal',
                        error_profile: error
                    });
                }

                userManager.update(request.user, function (error) {
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

            });
        } else if (action === ACTION_PASSWORD) { // if (action === ACTION_PROFILE) {
            var validation = validateActionPasswordUpdate(request);
            if (validation !== true) {

                return response.render('profile/personal.html.twig', {
                    action: 'profile.personal',
                    error_password: validation
                });
            }

            userManager.update(request.user, function (error) {
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
        projectManager.getAllForUser(request.user, (projects, error) => {
            response.render('profile/projects.html.twig', {
                action: 'profile.projects',
                projects: projects
            });
        });
    });

};
