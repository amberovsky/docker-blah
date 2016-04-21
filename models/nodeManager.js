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
     * @callback DatabaseOperationCallback
     *
     * @param {null|Boolean} isError - indicates was there an error during database operation (true) or null otherwise
     */

    /**
     * @constructor
     * 
     * @param {Application} application - application
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    constructor(application, callback) {
        // TODO
        this.sqlite3 = application.getSqlite3();
        this.nodes = {};

        var self = this;
        this.sqlite3.each("SELECT id, project_id, name, ip FROM node", function(error, row) {
            if (error === null) {
                var node = new Node(row.id, row.project_id, row.name, row.ip);
                self.nodes[node.getId()] = node;
            } else {
                console.log(error);
            }
        }, callback);
    };

    /**
     * @param {number} projectId - project id
     * 
     * @returns {Node[]} - all nodes in given project
     */
    filterByProjectId(projectId) {
        var nodes = [];

        for (var index in this.nodes) {
            if (this.nodes[index].getProjectId() == projectId) {
                nodes.push(this.nodes[index]);
            }
        }
        
        return nodes;
    };
    
}

module.exports = NodeManager;
