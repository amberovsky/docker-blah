"use strict";

/**
 * utils.js - project utils
 *
 * Copyright (C) 2016 Anton Zagorskii aka amberovsky. All rights reserved. Contacts: <amberovsky@gmail.com>
 */

class Utils {

    /**
     * @param {(string|number)} value - value to add zero'es
     * @param {number} [count] - what should be maximum value length, by default - 2
     * 
     * @returns {string} - value with added zero'es
     */
    leadZero(value, count) {
        if (typeof count === 'undefined') {
            count = 2;
        }
        
        while (value.toString().length < count) {
            value = '0' + value;
        }

        return value;
    };

}

module.exports = Utils;
