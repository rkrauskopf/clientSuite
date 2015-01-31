(function() {
    'use strict';

    var app = angular.module('InstrumentClient');

    app.controller('setServerCtrl', function($scope, $http, $location) {

        //var couchInstanceURL = 'http://localhost:5984/test_raspberry';

        $scope.url = '';
        $scope.couchDBInstance = '';
        $scope.bottlePort = 8080;

        Highcharts.setOptions({
            global: {
                useUTC: false
            }
        });

        if(localStorage['cachedUrl']) {
            $scope.url = localStorage['cachedUrl'];
        }

        if(localStorage['couchDBInstance']) {
            $scope.couchDBInstance = localStorage['couchDBInstance'];
        }

        $scope.error = "";
    });
})();