module.exports.controller = function (app) {

    app.get('/profile/personal/', function (request, response) {
        response.render('profile/personal.html.twig', {
            action: 'profile.personal'
        });
    });

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
            (name.length < app.docker_blah.userManager.MIN_TEXT_FIELD_LENGTH) ||
            (login.length < app.docker_blah.userManager.MIN_TEXT_FIELD_LENGTH)
        ) {
            return 'Name and login should be at least ' + app.docker_blah.userManager.MIN_TEXT_FIELD_LENGTH +
                ' characters.';
        }

        request.docker_blah.user
            .setName(name)
            .setLogin(login);

        return true;
    }

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
            (newPassword.length < app.docker_blah.userManager.MIN_TEXT_FIELD_LENGTH) ||
            (newPassword2.length < app.docker_blah.userManager.MIN_TEXT_FIELD_LENGTH)
        ) {
            return 'Passwords should be at least ' + app.docker_blah.userManager.MIN_TEXT_FIELD_LENGTH +
                ' characters.';
        }

        if (newPassword !== newPassword2) {
            return 'New passwords do not match.';
        }

        if (
            !app.docker_blah.authManager.checkPasswordMatch(request.docker_blah.user.getPasswordHash(), currentPassword)
        ) {
            return 'Wrong current password';
        }

        request.docker_blah.user.setPasswordHash(app.docker_blah.authManager.hashPassword(newPassword));

        return true;
    }

    app.post('/profile/personal/', function(request, response) {
        const   ACTION_PERSONAL = 'personal';
        const   ACTION_PASSWORD = 'password';

        var action = request.body.action;

        if (typeof action === 'undefined') {
            return response.render('profile/personal.html.twig', {
                action: 'profile.personal',
                error_profile: 'Wrong request.'
            });
        }
        
        var currentUser = request.docker_blah.user;

        if (action === ACTION_PERSONAL) {
            var validation = validateActionPersonalUpdate(request, request.docker_blah.user);
            if (validation !== true) {
                return response.render('profile/personal.html.twig', {
                    action: 'profile.personal',
                    error_profile: validation
                });
            }

            app.docker_blah.userManager.update(request.docker_blah.user, function (error) {
                if (!error) {
                    response.render('profile/personal.html.twig', {
                        action: 'profile.personal',
                        success_profile: 'Profile was updated.'
                    });
                } else {
                    request.docker_blah.user = currentUser;
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
            
            app.docker_blah.userManager.update(request.docker_blah.user, function (error) {
                if (!error) {
                    response.render('profile/personal.html.twig', {
                        action: 'profile.personal',
                        success_password: 'Password was changed.'
                    });
                } else {
                    request.docker_blah.user = currentUser;
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
    
    app.get('/profile/projects/', function (request, response) {
        response.render('profile/projects.html.twig', {
            action: 'profile.projects',
            projects: app.docker_blah.projectManager.getAllForUser(request.docker_blah.user)
        });
    });

};
