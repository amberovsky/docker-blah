module.exports.controller = function (app) {
    app.get('/help/', function (request, response) {
        response.render('help/index.html.twig', {
            action: 'help.index'
        });
    })
};
