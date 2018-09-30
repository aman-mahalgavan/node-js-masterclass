// Library for toring and editing data
// Dependencies - 
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// container for the module (to be exported)
const lib = {};

// base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Write data to a file
lib.create = (dir, file, data, callback) => {
    // Open the file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', (err, fileDescriptor) => {
        if(!err && fileDescriptor){
            // convert data to string
            let stringData = JSON.stringify(data);

            // write to a file and close it.
            fs.writeFile(fileDescriptor, stringData, (err) => {
                if(!err){
                    fs.close(fileDescriptor, (err) => {
                        if(!err){
                            callback(false);
                        }else{
                            callback(`Error closing new file. Error Thrown: ${err}`);
                        }
                    })
                }else{
                    callback(`Error writing to a new file. Error Thrown: ${err}`);
                }
            })
        }else{
            callback(`Could not create a new file, it may already exist. Thrown Error: ${err}`);
        }
    });
};

// Read data from a file
lib.read = (dir, file, callback) => {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', (err, data) => {
        if(!err && data){
            var parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        }else{
            callback(err, data);
        }
    })
};

// Delete the file
lib.delete = (dir, file, callback) => {
    // Unlink the file
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', (err) => {
        if(!err){
            callback(false);
        }else{
            callback(`Error deleting the file. Error thrown: ${err}`);
        }
    });
};

// Update Existing file with new data
lib.update = (dir, file, data, callback) => {
    // Open the file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fileDescriptor) => {
        if(!err && fileDescriptor){
            // convert data to string
            let stringData = JSON.stringify(data);
            // Truncate the file
            fs.truncate(fileDescriptor, (err) => {
                if(!err){
                    //  Write to the file ande close it
                    fs.writeFile(fileDescriptor, stringData, (err) => {
                        if(!err){
                            fs.close(fileDescriptor, (err) => {
                                if(!err){
                                    callback(false);
                                }else{
                                    callback(`Error closing the file. Error thrown: ${err}`);
                                }
                            })
                        }else{
                            callback(`Error writing to existing file. Error Thrown ${err}`);
                        }
                    })
                }else{
                    callback(`Error truncating file. Error Thrown: ${err}`);
                }
            })
        }else{
            callback(`Could not open the file for updating.It may not exist yet. Error Thrown: ${err}`)
        }
    })
};

// Export the module
module.exports = lib;