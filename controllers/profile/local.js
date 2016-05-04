"use strict";

/**
 * local.js - user's local docker
 *
 * /profile/local/*
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/**
 * @param {Application} application - application
 */
module.exports.controller = function (application) {

    /**
     * View local
     */
    application.getExpress().get('/profile/local/', function (request, response) {
        response.render('profile/local/index.html.twig', {
            action: 'profile.local'
        });
    });

    /**
     * @param {Object} request - expressjs request
     * @param {Node} node - node
     * @param {NodeOperaionCallback} callback - node operation callback
     */
    function validateActionLocalInfo(request, node, callback) {
        var
            name = request.body.name,
            ip = request.body.ip,
            port = request.body.port;

        node
            .setName(name)
            .setIp(ip)
            .setP
    }

    /**
     * @param {Object} request - expressjs request
     * @param {Project} project - project
     * @param {ProjectOperationCallback} callback - project operation callback
     */
    function validateActionLocalFiles(request, project, callback) {
        var
            fs = require('fs'),
            fileCA = '',
            fileCERT = '',
            fileKEY = '';

        for (var i in request.files) {
            var content = fs.readFileSync(request.files[i].path);

            switch (request.files[i].fieldname) {
                case 'file_key':
                    fileKEY = content;
                    break;

                case 'file_ca':
                    fileCA = content;
                    break;

                case 'file_cert':
                    fileCERT = content;
                    break;

                default:
                    return callback('Wrong filename in the request [' + request.files[i].fieldname + ']', null);
            }
        }

        if ((fileCA === '') || (fileCERT === '') || (fileKEY === '')) {
            return callback('There are not all files in the request', null);
        }

        return callback(null, project);
    }

    application.getExpress().post('/profile/local/', function (request, response) {
        var
            fs = require('fs'),
            project = null;

        var process = (project) => {
            validateActionLocalFiles(request, project, (error, project) => {

                for (var i in request.files) {
                    fs.unlinkSync(request.files[i].path);
                }

                if (error === null) {
                    response.render('profile/local/index.html.twig', {
                        action: 'profile.local',
                        success: 'Local docker was created'
                    });
                } else {
                    response.render('profile/local/index.html.twig', {
                        action: 'profile.local',
                        error: error
                    });
                }
            });
        };
        
        if (request.user.getLocalId() === -1) {
            project = request.projectManager.create();
            return process(project.setUserId());
        } else {
            request.projectManager.getById(request.user.getLocalId(), (error, project) => {
                if (error === null) {
                    return process(project);
                } else {
                    return response.render('profile/local/index.html.twig', {
                        action: 'profile.local',
                        error: 'Couldn\'t find your local docker'
                    });
                }
            });
        }
    });

};
