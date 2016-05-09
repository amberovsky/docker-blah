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
     * Callback to be used for all operations with Node
     *
     * @callback NodeOperationCallback
     *
     * @param {(null|string)} error - error message
     * @param {(null|boolean|Node|Object.<number, Node>)} node - node (or list of nodes) after applied operation or null
     *        if no node with given criteria or boolean for check/if/does operations
     */


    /**
     * @constructor
     *
     * @param {Application} application - application
     * @param {winston.Logger} logger - logger
     */
    constructor(application, logger) {
        /** @property {number} MIN_TEXT_FIELD_LENGTH - @constant minimum length for Node text properties */
        application.createConstant(this, 'MIN_TEXT_FIELD_LENGTH', 5);

        this.sqlite3 = application.getSqlite3();
        this.logger = logger;
    };

    /**
     * 
     * @param {number} projectId - create a node in this project
     * 
     * @returns {Node} new blank node in the given project
     */
    create(projectId) {
        return new Node(-1, projectId, '', '', '');
    };

    /**
     * Creates a new node from given values from database
     *
     * @param {sqlite3.row} row - row from database
     *
     * @returns {Node} new node
     */
    createFromRow(row) {
        return new Node(row.id, row.project_id, row.name, row.ip, row.port);
    }

    /**
     * Get node by id
     *
     * @param {number} id - node's id
     * @param {NodeOperationCallback} callback - node operation callback
     */
    getById(id, callback) {
        var self = this;

        this.sqlite3.get(
            'SELECT id, name, ip, project_id, port FROM node WHERE (id = ?)', [id], function (error, row) {
                if (typeof row === 'undefined') {
                    callback(null, null);
                } else if (error === null) {
                    callback(null, self.createFromRow(row));
                }  else {
                    self.logger.error(error);
                    callback(error, null);
                }
            }
        );
    };


    /**
     * Get node by id in given project
     *
     * @param {number} id - node's id
     * @param {number} projectId - project's id
     * @param {NodeOperationCallback} callback - node operation callback
     */
    getByIdAndProjectId(id, projectId, callback) {
        var self = this;

        this.sqlite3.get(
            'SELECT id, name, ip, project_id, port FROM node WHERE (id = ?) AND (project_id = ?)',
            [
                id,
                projectId
            ],
            function (error, row) {
                if (typeof row === 'undefined') {
                    callback(null, null);
                } else if (error === null) {
                    callback(null, self.createFromRow(row));
                }  else {
                    self.logger.error(error);
                    callback(error, null);
                }
            }
        );
    };

    /**
     * @param {string} name - node's name
     * @param {string} ip - node's ip
     * @param {number} currentNodeId - which node to skip
     * @param {number} projectId - what project given node belongs to
     * @param {NodeOperationCallback} callback - node operation callback
     */
    doesExistWithSameNameOrIpInProject(name, ip, currentNodeId, projectId, callback) {
        var self = this;

        this.sqlite3.get(
            'SELECT id FROM node WHERE (id <> ?) AND (project_id = ? ) AND ((name = ?) OR (ip = ?)) ',
            [
                currentNodeId,
                projectId,
                name,
                ip
            ],
            function (error, row) {
                if (typeof row === 'undefined') {
                    callback(null, false);
                } else if (error === null) {
                    callback(null, true);
                }  else {
                    self.logger.error(error);
                    callback(error, true);
                }
            }
        );
    };

    /**
     * Get nodes for given project
     * 
     * @param {number} projectId - project id
     * @param {NodeOperationCallback} callback - node operation callback
     */
    getByProjectId(projectId, callback) {
        var
            nodes = {},
            self = this;

        this.sqlite3.each(
            'SELECT id, project_id, name, ip, port FROM node WHERE (project_id = ?)',
            [projectId],
            function (error, row) {
                if (error === null) {
                    var node = self.createFromRow(row);
                    nodes[node.getId()] = node;
                } else {
                    this.logger.error(error);
                    callback(error, {});
                }
            }, function (error) {
                if (error !== null) {
                    self.logger.error(error);
                }
                
                callback(error, nodes);
            }
        );
    };

    /**
     * Add a new node
     *
     * @param {Node} node - new node
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    add(node, callback) {
        var self = this;

        this.sqlite3.run(
            'INSERT INTO node (name, project_id, ip, port) VALUES (?, ?, ?, ?)',
            [
                node.getName(),
                node.getProjectId(),
                node.getIp(),
                node.getPort()
            ], function (error) {
                if (error === null) {
                    node.setId(this.lastID);
                    callback(null);
                } else {
                    self.logger.error(error);
                    callback(error);
                }
            }
        );
    };

    /**
     * Update node data
     *
     * @param {Node} node - node with new values
     * @param {DatabaseOperationCallback} callback - database operation callback
     */
    update(node, callback) {
        var self = this;

        this.sqlite3.run(
            'UPDATE node SET name = ?, ip = ?, port = ? WHERE id = ?',
            [
                node.getName(),
                node.getIp(),
                node.getPort(),
                node.getId()
            ], function (error) {
                if (error === null) {
                    if (this.changes === 0) {
                        self.logger.error('No rows were updated');
                        callback('No rows were updated')
                    } else {
                        callback(null);
                    }
                } else {
                    self.logger.error(error);
                    callback(error);
                }
            }
        );
    };

    /**
     * Delete node
     *
     * @param {number} nodeId - node id
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    deleteNode(nodeId, callback) {
        var self = this;

        this.sqlite3.run('DELETE FROM node WHERE id = ?', [nodeId], function (error) {
            if (error === null) {
                callback(null);
            } else {
                self.logger.error(error);
                callback(error);
            }
        });
    };

    /**
     * Delete all nodes in the given project
     *
     * @param {number} projectId - project id
     * @param {DatabaseOperationCallback} callback - database operations callback
     */
    deleteByProjectId(projectId, callback) {
        var self = this;

        this.sqlite3.run('DELETE FROM node WHERE project_id = ?', [projectId], function (error) {
            if (error === null) {
                callback(null);
            } else {
                self.logger.error(error);
                callback(error);
            }
        });
    };


}

module.exports = NodeManager;
