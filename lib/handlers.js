/* 
    These are the request handlers
*/

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Define Handlers
const handlers = {};
const MethodsContainer = {};

handlers.sample = (data, callback) => {
    // callback http status code & a payload which will be an object
    callback(406, { name: "sample handler" });
};

handlers.ping = (data, callback) => {
    callback(200);
};

handlers.helloWorld = (data, callback) => {
    let acceptableMethods = ['post'];

    if (acceptableMethods.indexOf(data.method) > -1) {
        MethodsContainer._helloWorld[data.method](data, callback);
    } else {
        callback(405);
    };
}

// Container for Helloworls Sub-Methods
MethodsContainer._helloWorld = {
    post: (data, callback) => {
        callback(200, {message: "Hi, Welcome to my server. This is my take on the Nodejs Master Class by Leslie Lewis."})
    }
}

handlers.users = (data, callback) => {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];

    if (acceptableMethods.indexOf(data.method) > -1) {
        MethodsContainer._users[data.method](data, callback);
    } else {
        callback(405);
    };
};

// Container for Users Sub-Methods
MethodsContainer._users = {
    post: (data, callback) => {
        // Required data: firstName, lastName, phone, password, tosAgreement
        // optional data: none
        // Check that all the required fields are filled out
        let firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName : false;

        let lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName : false;

        let phone = typeof (data.payload.phone) == 'number' && data.payload.phone.toString().length == 10 ? data.payload.phone : false;

        let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;

        let tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

        if (firstName && lastName && phone && password) {
            // Make sure that the user doesn't already exist
            _data.read('users', phone, (err, data) => {
                if (err) {
                    // Hash the password
                    let hashedPassword = helpers.hash(password);

                    if (hashedPassword) {

                        // create the user object
                        let userObject = {
                            firstName: firstName,
                            lastName: lastName,
                            phone: phone,
                            hashedPassword: hashedPassword,
                            tosAgreement: true
                        };

                        // Store the user
                        _data.create('users', phone, userObject, (err) => {
                            if (!err) {
                                callback(200, { Data: userObject });
                            } else {
                                callback(500, { Error: 'Could not create a new user.' });
                            }
                        });
                    } else {
                        callback(500, { Error: 'Could not hash the user password.' });
                    }

                } else {
                    // user already exists
                    callback(400, { Error: 'A User with that phone number already exists.' });
                }
            });
        } else {
            callback(400, { 'Error': 'Missing Required Fields' })
        }

    },
    get: (data, callback) => {
        // users - get
        // Required Data: phone
        // Required Headers: token
        // Options Data: none
        // Check that the phone number is valid
        let phone = data.queryStringObject.phone && typeof (data.queryStringObject.phone == 'string') && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone : false;
        if (phone) {
            // Get the token from the headers
            let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
            // Verify that the given token is valid dor the phone number
            MethodsContainer._tokens.verifyToken(token, phone, (tokenIsValid) => {
                if(tokenIsValid){
                    // Lookup the user
                    _data.read('users', phone, (err, data) => {
                        if (!err && data) {
                            // Remove the hased password from the user object before returning it to the requester
                            delete data.hashedPassword;
                            callback(200, data);
                        } else {
                            callback(404);
                        }
                    })
                }else{
                    callback(403, {"Error": "Missing required token in the header or token is invalid."})
                };
            });
        } else {
            callback(400, { Error: 'Missing required field.' })
        }
    },
    put: (data, callback) => {
        // Users - put
        // Required Data : phone
        // Optional Data : firstName, lastName, password (Note: Atleast 1 must be specified)
        // Check for the required field
        let phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone : false;

        // Check for the optional fields
        let firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName : false;

        let lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName : false;

        let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;

        // Error if the phone is invalid
        if (phone) {
            // Error if nothing is sent to update
            if (firstName || lastName || password) {

                // Get the token from the headers
                let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                // Verify that the given token is valid dor the phone number
                MethodsContainer._tokens.verifyToken(token, phone, (tokenIsValid) => {
                    if(tokenIsValid){

                        _data.read('users', phone, (err, usrData) => {
                            if (!err && usrData) {
                                // Update the fields necessary
                                if (firstName) {
                                    usrData.firstName = firstName;
                                }
                                if (lastName) {
                                    usrData.lastName = lastName;
                                }
                                if (password) {
                                    usrData.hashedPassword = helpers.hash(password);
                                }
                                // Store the new updates
                                _data.update('users', phone, usrData, (err) => {
                                    if (!err) {
                                        callback(200);
                                    } else {
                                        console.log(err);
                                        callback(500, { Error: 'Could not update the user' });
                                    }
                                });
                            } else {
                                callback(400, { Error: 'The specified user does not exist' });
                            }
                        })
                    }else{
                        callback(403, {"Error": "Missing required token in the header or token is invalid."})
                    }
                });
            } else {
                callback(400, { Error: 'Missing fields to update' })
            }
        } else {
            callback(400, { Error: 'Missing required field' })
        }
    },
    delete: (data, callback) => {
        // Required field- phone
        // @TODO - Only let an authenticated user delete their object, Don't let them deltee anyone elses data
        // Check that the phone number is valid
        let phone = data.queryStringObject.phone && typeof (data.queryStringObject.phone == 'string') && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone : false;
        if (phone) {
             // Get the token from the headers
             let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
             // Verify that the given token is valid dor the phone number
             MethodsContainer._tokens.verifyToken(token, phone, (tokenIsValid) => {
                 if(tokenIsValid){
                    // Lookup the user
                    _data.read('users', phone, (err, data) => {
                        if (!err && data) {
                            _data.delete('users', phone, (err) => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(500, { Error: 'Could not delete the specified user.' })
                                }
                            })
                        } else {
                            callback(400, { Error: 'Could not find the specified user.' });
                        }
                    })
                 }else{
                    callback(403, {"Error": "Missing required token in the header or token is invalid."})
                 }
            })
            
        } else {
            callback(400, { Error: 'Missing required field.' })
        }
    }
};

handlers.notFound = (data, callback) => {
    callback(404);
};

// Tokens
handlers.tokens = (data, callback) => {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];

    if (acceptableMethods.indexOf(data.method) > -1) {
        MethodsContainer._tokens[data.method](data, callback);
    } else {
        callback(405);
    };
};

// Container for Tokens Sub-Methods
MethodsContainer._tokens = {
    post: (data, callback) => {
        // Tokens- Post
        // Required Data: phone, password
        // Optional Data: none
        let phone = typeof (data.payload.phone) == 'number' && data.payload.phone.toString().length == 10 ? data.payload.phone : false;
        let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;

        if (phone && password) {
            // Lookup the user that matches that phone number
            _data.read('users', phone, (err, userData) => {
                if (!err && userData) {
                    // Hash the sent password and compare it with the hashed password stored in the user's object
                    let hashedPassword = helpers.hash(password);
                    if (hashedPassword == userData.hashedPassword) {
                        // if valid, create a new token
                        let tokenId = helpers.createRandomString(20);
                        let expires = Date.now() + 1000 * 60 * 60;
                        let tokenObject = {
                            phone,
                            id: tokenId,
                            expires
                        };

                        // Store the token
                        _data.create('tokens', tokenId, tokenObject, (err) => {
                            if (!err) {
                                callback(200, tokenObject);
                            } else {
                                callback(500, { Error: 'Could not create the new token.' });
                            }
                        });
                    } else {
                        callback(400, { Error: 'The Password did not match the stored user\'s password' });
                    }
                } else {
                    callback(400, { Error: 'Could not find the specified user.' });
                }
            });
        } else {
            callback(400, { Error: 'Missing required field(s).' });
        }

    },
    get: (data, callback) => {
        // Tokens- Get
        // Required Data: phone
        // Optional Data: none
        let id = data.queryStringObject.id && typeof (data.queryStringObject.id == 'string') && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
        if (id) {
            // Lookup the token
            _data.read('tokens', id, (err, tokenData) => {
                if (!err && tokenData) {
                    callback(200, tokenData);
                } else {
                    callback(404);
                }
            })
        } else {
            callback(400, { Error: 'Missing required field.' })
        };
    },
    put: (data, callback) => {
        // Tokens- Put
        // Required Fields: id, extend
        // Optional Data: none
        let id = data.payload.id && typeof (data.payload.id == 'string') && data.payload.id.trim().length == 20 ? data.payload.id : false;
        let extend = data.payload.extend && typeof (data.payload.extend == 'boolean') && data.payload.extend == true ? data.payload.extend : false;
        if (id && extend) {
            // Lookup the token
            _data.read('tokens', id, (err, tokenData) => {
                if (!err && tokenData) {
                    // check to make sure the token isn't already expired
                    if(tokenData.expires > Date.now()){
                        // Set the expiration an hour from now
                        tokenData.expires = Date.now() + 1000 * 60 * 60;

                        // Store the new updates
                        _data.update("tokens", id, tokenData, (err) => {
                            if(!err){
                                callback(200);
                            }else{
                                callback(500, {"Error": "Could not update the token\'s expiration."});
                            }
                        });
                    }else{
                        callback(400, {"Error": "The token has already expired and cannot be extended."})
                    }
                    // callback(200, tokenData);
                } else {
                    callback(400, {"Error": "Specified token does not exist"});
                }
            })
        } else {
            callback(400, { Error: 'Missing required field(s) or field(s) are invalid.' })
        };
    },
    delete: (data, callback) => {
        // Tokens- Delete
        // Required Data: id
        // Optional Data: none
        // Check that the id is valid
        let id = data.queryStringObject.id && typeof (data.queryStringObject.id == 'string') && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
        if (id) {
            // Lookup the token
            _data.read('tokens', id, (err, data) => {
                if (!err && data) {
                    _data.delete('tokens', id, (err) => {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, { Error: 'Could not delete the specified token.' })
                        }
                    })
                } else {
                    callback(400, { Error: 'Could not find the specified token.' });
                }
            })
        } else {
            callback(400, { Error: 'Missing required field.' })
        }
    },
    verifyToken: (id, phone, callback) => {
        // Verify is the given token id is currently valid for a given user
        _data.read('tokens', id, (err, tokenData) => {
            if(!err && tokenData){
                if(tokenData.phone == phone && tokenData.expires > Date.now()){
                    callback(true);
                }else{
                    callback(false);
                }
            }else{
                callback(false);
            }
        })
    }
};

// Export the module
module.exports = handlers;