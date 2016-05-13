"use strict";

/**
 * personal.js - user's personal info
 *
 * /profile/personal/*
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
     * @param {DatabaseOperationCallback} callback - callback
     */
    function validateActionPersonalUpdate(request, callback) {
        var
            name = request.body.name,
            login = request.body.login;

        request.user
            .setName(name)
            .setLogin(login)

        if ((typeof name === 'undefined') || (typeof login === 'undefined')) {
            return callback('Not enough data in the request.');
        }

        name = name.trim();
        login = login.trim();

        if (
            (name.length < request.userManager.MIN_TEXT_FIELD_LENGTH) ||
            (login.length < request.userManager.MIN_TEXT_FIELD_LENGTH)
        ) {
            return callback(
                'Name and login should be at least ' + request.userManager.MIN_TEXT_FIELD_LENGTH + ' characters.'
            );
        }

        request.userManager.getByLogin(login, request.user.getId(), (foundUser, error) => {
            if (foundUser !== null) {
                return callback('User with login [' + login + '] already exists.');
            }

            request.user
                .setName(name)
                .setLogin(login);

            return callback(null);
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
            (newPassword.length < request.userManager.MIN_TEXT_FIELD_LENGTH) ||
            (newPassword2.length < request.userManager.MIN_TEXT_FIELD_LENGTH)
        ) {
            return 'Passwords should be at least ' + request.userManager.MIN_TEXT_FIELD_LENGTH + ' characters.';
        }

        if (newPassword !== newPassword2) {
            return 'New passwords do not match.';
        }

        if (!application.getAuth().checkPasswordMatch(request.user.getPasswordHash(), currentPassword)) {
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
            validateActionPersonalUpdate(request, (error) => {
                if (error !== null) {
                    return response.render('profile/personal.html.twig', {
                        action: 'profile.personal',
                        error_profile: error
                    });
                }

                request.userManager.update(request.user, function (error) {
                    if (error === null) {
                        response.render('profile/personal.html.twig', {
                            action: 'profile.personal',
                            success_profile: 'Profile was updated.'
                        });
                    } else {
                        request.logger.error(error);
                        
                        request.user = currentUser;
                        response.render('profile/personal.html.twig', {
                            action: 'profile.personal',
                            error_profile: 'Got error. Contact your system administrator.'
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

            request.userManager.update(request.user, function (error) {
                if (error === null) {
                    response.render('profile/personal.html.twig', {
                        action: 'profile.personal',
                        success_password: 'Password was changed.'
                    });
                } else {
                    request.logger.error(error);
                    
                    request.user = currentUser;
                    response.render('profile/personal.html.twig', {
                        action: 'profile.personal',
                        error_password: 'Got error. Contact your system administrator.'
                    });
                }
            });

        } else { // } else if (action === ACTION_PASSWORD) { // if (action === ACTION_PROFILE) {
            request.logger.error('wrong request ' + action);
            
            response.render('profile/personal.html.twig', {
                action: 'profile.personal',
                error_profile: 'Wrong request'
            });
        }
    });

};
