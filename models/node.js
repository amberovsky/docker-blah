"use strict";

class Node {
    
    constructor (id, projectId, name, ip) {
        this.id = id;
        this.projectId = projectId;
        this.name = name;
        this.ip = ip;
    };

    getId() {
        return this.id;
    };

    getProjectId() {
        return this.projectId;
    }

    getName() {
        return this.name;
    };

    getIp() {
        return this.ip;
    }
    
}

module.exports = Node;
