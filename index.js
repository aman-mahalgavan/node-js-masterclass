const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const config = require('./config');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');
// Instantiating the HTTP server
const httpServer = http.createServer((req, res) => unifiedServer(req, res));

// Start the HTTP server
httpServer.listen(config.httpPort, () => {
    console.log("The Server is listenig to port " + config.httpPort + " in " + config.envName + " mode");
});

// TODO: Download SSL Certificate and create key.pem and cert.pem files
// const httpsServerOptoins = {
//     'key' : fs.readFileSync('./https/key.pem'),
//     'cert' : fs.readFileSync('./https/cert.pem')
// };

// Instantiate the HTTPS server
// const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
//     unifiedServer(req, res);
// });

// Start the HTTPS server
// httpsServer.listen(config.httpsPort, () => {
//     console.log("env => ", process.env);
//     console.log("The Server is listenig to port " + config.httpsPort + " in " + config.envName + " mode");
// });

const unifiedServer = (req, res) => {

    // Get the URL and parse it
    let parsedUrl = url.parse(req.url, true);

    // Get the Path
    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    let queryStringObject = parsedUrl.query;

    // Get the HTTP Method
    let method = req.method.toLowerCase();

    // Get he Headers as an object
    let headers = req.headers;

    // Get the payload, if any
    let decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });

    req.on('end', () => {
        buffer += decoder.end();

        // choose the handler this request should go to. If one is not found then use the notFound handler.
        let chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound
        console.log("chosenHandler => ", chosenHandler);
        // construct the data object to send to the handler
        let data = {
            trimmedPath: trimmedPath,
            queryStringObject: queryStringObject,
            method: method,
            headers: headers,
            payload: helpers.parseJsonToObject(buffer) // comes from the request body
        };

        // route the request to the handler specified in the router
        chosenHandler(data, (statusCode, payload) => {
            // use the status code called back by the handler or default ot 200
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;
            // use the payload called back by the handler or default to {}
            payload = typeof (payload) == 'object' ? payload : {};

            // convert the payload to a string
            let payloadString = JSON.stringify(payload);

            // set the content-type to application/json in the headers
            res.setHeader('content-type', 'application/json');
            // return the response
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log the Request Details
            console.log("Returning this response: ", statusCode, payloadString, data);
        });

    });

};

// Define Request Router
let router = {
    "sample": handlers.sample,
    "ping": handlers.ping,
    "users": handlers.users,
    "tokens": handlers.tokens
};

