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
     * @constructor
     *
     * @param {Application} application - application
     * @param {NextCallback} next - next callback
     */
    constructor(application, next) {
        this.sqlite3 = application.getSqlite3();
        this.nodes = {};

        var self = this;
        this.sqlite3.each("SELECT id, project_id, name, ip FROM node", function(error, row) {
            if (error === null) {
                var node = new Node(row.id, row.project_id, row.name, row.ip);
                self.nodes[node.getId()] = node;
            } else {
                application.handleErrorDuringStartup(error);
            }
        }, next);
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
