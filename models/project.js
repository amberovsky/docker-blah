"use strict";

class Project {
    
    constructor (id, name) {
        this.id = id;
        this.name = name;
    };
    
    setId(id) {
        this.id = id;
        
        return this;
    }

    getId() {
        return this.id;
    };

    setName(name) {
        this.name = name;

        return this;
    }

    getName() {
        return this.name;
    };
    
}

module.exports = Project;
