"use strict";

/**
 *
 * docker-blah | docker be less as hossible
 *
 * Easy and fast way to manage your containers.
 *
 * (C) Anton Zagorskii aka amberovsky
 */


/** @type {Application} */
new (require('./library/application.js'))();


// app.get('/', function (req, res) {
//     var Docker = require('dockerode');
//     var docker2 = new Docker({
//         host: '192.168.99.100',
//         protocol: 'https',
//         ca: fs.readFileSync('/Users/anton.zagorskii/.docker/machine/machines/default/ca.pem'),
//         cert: fs.readFileSync('/Users/anton.zagorskii/.docker/machine/machines/default/cert.pem'),
//         key: fs.readFileSync('/Users/anton.zagorskii/.docker/machine/machines/default/key.pem'),
//         port: 2376
//     });
//
//
//     var dd = [];
//
//
//     docker2.listImages(function (err, images) {
//         images.forEach(function (imageInfo) {
//             dd.push(imageInfo);
//             // console.log(imageInfo);
//         });
//
//         // res.render('partials/auth.html.twig', { ii: dd });
//         res.render('index.html.twig');
//     });
// });
