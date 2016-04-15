"use strict";

var Node = require('./node.js');

class NodeManager {
    
    constructor(app, sqlite3, callback) {
        this.app = app;
        this.sqlite3 = sqlite3;
        this.nodes = {};

        var self = this;
        this.sqlite3.each("SELECT id, project_id, name, ip FROM node", function(err, row) {
            var node = new Node(row.id, row.project_id, row.name, row.ip);
            self.nodes[node.getId()] = node;
        }, callback);

    };

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
