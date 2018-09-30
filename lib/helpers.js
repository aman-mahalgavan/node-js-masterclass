/*
    Helpers for various tasks
*/

// Dependencies
const crypto = require('crypto');
const config = require('../config');

// Container for all the Helpers
const helpers = {};

// Create a SHA256 hash
helpers.hash = (string) => {
    if (typeof (string) == 'string' && string.length > 0) {
        let hash = crypto.createHmac('sha256', config.hashingSecret).update(string).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// Parse a JSON string to an object in all cases without throwing
helpers.parseJsonToObject = (string) => {
    try {
        let obj = JSON.parse(string);
        return obj;
    } catch (e) {
        return {};
    }
};

// Create a string of random alphanumeric characters of given length
helpers.createRandomString = (length) => {
    length = typeof (length) == 'number' && length > 0 ? length : false;
    if (length) {
        let possibleCharacters = '0123456789abcdefghijklmnopqrstuvwxyz';
        let string = '';
        for (let i = 1; i <= length; i++) {
            let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            string += randomCharacter;
        }
        console.log("Generated Random String by helper method - ", string);
        return string;
    } else {
        return false;
    }
}

// Export the module
module.exports = helpers;