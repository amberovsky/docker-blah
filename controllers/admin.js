module.exports.controller = function (app) {
    
    app.get('/admin/events/', function (request, response) {
        response.render('admin/events.html.twig', {
            action: 'admin.events'
        });
    });

    app.get('/admin/settings', function (request, response) {
        response.render('admin/settings.html.twig', {
            action: 'admin.settings'
        });
    });
    
};
