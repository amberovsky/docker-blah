"use strict";

/**
 * nodeManager.js - Manager for Node. Responsible for saving, retrieving, search.
 *
 * (C) Anton Zagorskii aka amberovsky
 */

/** @type {Node} */
var Node = require('./node.js');

class NodeManager {

    /**
     * Callback to be used for all database operations
     *
     * @callback NodeOperationCallback
     *
     * @param {(null|Node|Object.<number, Node>)} node - node (or list of nodes) after applied operation or null if no
     *                                                   node with given criteria
     * @param {(null|string)} error - error message
     */


    /**
     * @constructor
     *
     * @param {Application} application - application
     */
    constructor(application) {
        this.sqlite3 = application.getSqlite3();
    };

    /**
     * Get nodes for given project
     * 
     * @param {number} projectId - project id
     * @param {NodeOperationCallback} callback - node operation callback
     */
    filterByProjectId(projectId, callback) {
        var nodes = {};

        this.sqlite3.each(
            'SELECT id, project_id, name, ip FROM node WHERE (project_id = ?)',
            [projectId],
            function(error, row) {
                if (error === null) {
                    var node = new Node(row.id, row.project_id, row.name, row.ip);
                    nodes[node.getId()] = node;
                } else {
                    callback({}, error);
                }
            }, function (error) {
                callback(nodes, error);
            }
        );
    };
    
}

module.exports = NodeManager;
