(function() {
    'use strict';

    var app = angular.module('InstrumentClient');

    app.controller('setServerCtrl', function($scope, $http, $location) {

        //var couchInstanceURL = 'http://localhost:5984/test_raspberry';

        $scope.url = '';
        $scope.couchDBInstance = '';

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

        $scope.getData = function getData() {
            $http.get($scope.url + '/')
                .success(function(data, status) {
                    //Checking for a 'pulse' from the couchDB instance, if we get
                    //a successful response then we'll move on to the next page,
                    //while storing the url and db instance for future use.


                    localStorage['cachedUrl'] = $scope.url;
                    localStorage['couchDBInstance'] = $scope.couchDBInstance;

                    $location.url('dataView');

                })
                .error(function(data, status) {
                    //Unable to find the specified couchDB instance. Present user with an error.
                    console.error("Unable to connect to couchDB instance");
                    $scope.error = data;
                });
        };
    });
})();