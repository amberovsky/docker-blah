"use strict";

class Project {
    
    constructor (id, name) {
        this.id = id;
        this.name = name;
    };

    getId() {
        return this.id;
    };

    getName() {
        return this.name;
    };
    
}

module.exports = Project;
