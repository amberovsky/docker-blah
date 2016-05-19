"use strict";

/**
 *
 * docker-blah | docker be less as hossible
 *
 * Easy and fast way to manage your docker projects.
 *
 * (C) Anton Zagorskii aka amberovsky amberovsky@gmail.com
 */


/** @type {Application} */
new (require('./library/application.js'))();

// var Docker = require('dockerode');
// var fs = require('fs');
//
// var mocker = new Docker({
//     host: '192.168.99.100',
//     protocol: 'https',
//         ca: fs.readFileSync('/Users/anton.zagorskii/.docker/machine/machines/default/ca.pem'),
//         cert: fs.readFileSync('/Users/anton.zagorskii/.docker/machine/machines/default/cert.pem'),
//         key: fs.readFileSync('/Users/anton.zagorskii/.docker/machine/machines/default/key.pem'),
//     port: 2376
// });
//
// var stream = require('stream');
//
// /**
//  * Get logs from running container
//  */
// function containerLogs(container) {
//
//     // create a single stream for stdin and stdout
//     var logStream = new stream.PassThrough();
//     logStream.on('data', function(chunk){
//         console.log(chunk.toString());
//     });
//
//     container.logs({
//         follow: true,
//         stdout: true,
//         stderr: true
//     }, function(err, stream){
//         if(err) {
//             return logger.error(err.message);
//         }
//         container.modem.demuxStream(stream, logStream, logStream);
//         stream.on('end', function(){
//             console.log('q');
//             // logStream.end('!stop!');
//         });
//     });
// }
//
// containerLogs(mocker.getContainer('9552a5cfcd0a'));