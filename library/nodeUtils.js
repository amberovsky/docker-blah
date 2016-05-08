"use strict";

/**
 * nodeUtils.js - Common parts for nodes
 *
 * (C) Anton Zagorskii aka amberovsky
 */

class NodeUtils {

    /**
     * @constructor
     *
     * @param {Object} request - expressjs request
     */
    constructor(request) {
        this.request = request;
    };

    /**
     * Validate request for create new project or update existing
     *
     * @param {boolean} isUpdate - is it update operation or create new
     * @param {DatabaseOperationCallback} callback - database operation callback
     */
    validateNodeActionCreateNewOrUpdate(isUpdate, callback) {
        var
            name = this.request.body.name,
            ip = this.request.body.ip,
            port = this.request.body.port;

        this.request.node
            .setName(name)
            .setIp(ip)
            .setPort(port);

        if ((typeof name === 'undefined') || (typeof ip === 'undefined') || (typeof port === 'undefined')) {
            return callback('Not enough data in the request.');
        }

        name = name.trim();
        ip = ip.trim();
        port = port.trim();

        if (name.length < this.request.nodeManager.MIN_TEXT_FIELD_LENGTH) {
            return callback(
                'Name should be at least ' + this.request.nodeManager.MIN_TEXT_FIELD_LENGTH + ' characters.'
            );
        }

        var IP = require('ip');

        if (!IP.isV4Format(ip) || (IP.fromLong(IP.toLong(ip)) !== ip)) {
            return callback('IP has to be in v4 format');
        }

        port = parseInt(port);
        if (Number.isNaN(port)) {
            return callback('Port has to be positive integer');
        }

        var nodeId = (isUpdate === true) ? this.request.node.getId() : -1;

        this.request.nodeManager.doesExistWithSameNameOrIpInProject(
            name, ip, nodeId, this.request.project.getId(), (error, check) => {
                if (check) {
                    return callback('Node with name [' + name + '] or ip [' + ip + '] already exists in this project.');
                }

                this.request.node
                    .setName(name)
                    .setIp(ip)
                    .setPort(port);

                return callback(null);
            }
        );
    }

}

module.exports = NodeUtils;
