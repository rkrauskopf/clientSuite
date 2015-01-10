(function() {
    'use strict';

    /**
     * This is the main entry point into the application.
     * This module contains application configuration, dependencies, and startup code.
     */
    var app = angular.module('InstrumentClient',['ngRoute', 'highcharts-ng']);

    // Configure URL routes
    app.config(function($routeProvider) {
        $routeProvider
            .when('/', {
                redirectTo: '/setServer/'
            })
            .when('/setServer', {
                templateUrl: 'views/setServer/setServer.html',
                controller: 'setServerCtrl'
            })
            .when('/dataView', {
                templateUrl: 'views/dataView/dataView.html',
                controller: 'dataViewCtrl'
            })
            .otherwise({
                templateUrl: 'views/404/404.html'
            });
    });


    // The 'deviceready' event lets us know that Cordova and all of its plugins have finished loading.
    document.addEventListener('deviceready',
        function() {
            // Now that the device is ready, we can bootstrap Angular.
            // This is what actually loads our main module and starts our app
            angular.bootstrap(window.document, ['InstrumentClient']);
        },
        false
    );
})();
