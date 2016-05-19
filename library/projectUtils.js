"use strict";

/**
 * projectUtils.js - Common parts for projects
 *
 * (C) Anton Zagorskii aka amberovsky amberovsky@gmail.com
 */

class ProjectUtils {

    /**
     * @constructor
     *
     * @param {Object} request - expressjs request
     */
    constructor(request) {
        this.request = request;
    };

    /**
     * Validate request for create new project or update existing (without certs)
     *
     * @param {boolean} isUpdate - is it update operation or create new
     * @param {DatabaseOperationCallback} callback - database operation callback
     */
    validateProjectActionCreateNewOrUpdateProject(isUpdate, callback) {
        var name = this.request.body.name;

        this.request.project.setName(name);
    
        if (typeof name === 'undefined') {
            return callback('Not enough data in the request.');
        }
    
        name = name.trim();
    
        if (name.length < this.request.projectManager.MIN_TEXT_FIELD_LENGTH) {
            return callback(
                'Name should be at least ' + this.request.projectManager.MIN_TEXT_FIELD_LENGTH + ' characters.'
            );
        }

        var projectId = (isUpdate === true) ? this.request.project.getId() : -1;

        this.request.projectManager.doesExistWithSameName(name, projectId, (error, check) => {
            if (check) {
                return callback('Project with name [' + name + '] already exists.');
            }

            this.request.project.setName(name);

            if (!isUpdate) {
                return this.validateProjectActionUpdateCerts(callback);
            } else {
                return callback(null);
            }
        });
    };

    /**
     * Validate request for create new project or update existing (without certs)
     *
     * @param {DatabaseOperationCallback} callback - database operation callback
     */
    validateProjectActionUpdateCerts(callback) {
        var
            fs = require('fs'),
            fileCA = '',
            fileCERT = '',
            fileKEY = '',
            error = null;

        for (var i in this.request.files) {
            var content = fs.readFileSync(this.request.files[i].path);
            fs.unlinkSync(this.request.files[i].path);

            switch (this.request.files[i].fieldname) {
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
                    error = 'Wrong filename in the request [' + this.request.files[i].fieldname + ']';
            }
        }

        if (error !== null) {
            callback(error);
        }

        if ((fileCA === '') || (fileCERT === '') || (fileKEY === '')) {
            return callback('There are not all files in the request');
        }

        this.request.project
            .setCA(fileCA)
            .setCERT(fileCERT)
            .setKEY(fileKEY);

        return callback(null);
    };

}

module.exports = ProjectUtils;
