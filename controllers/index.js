module.exports.controller = function (app) {
    app.get('/', function (request, response) {
        response.render('index/index.html.twig', {
            action: 'index.index'
        });
    })
};
