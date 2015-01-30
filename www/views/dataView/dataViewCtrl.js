(function() {
    'use strict';

    var app = angular.module('InstrumentClient');

    app.controller('dataViewCtrl', function($scope, $http) {
        var couchInstanceURL = localStorage['cachedUrl'] + '/' + localStorage['couchDBInstance'];

        //This is a pre-defined view on the couchdb instance that returns the requested variables
        var viewRoute = '/_design/Readings/_view/all_readings';

        var allInputsObj = {};

        $scope.filterValue = "all";

        $scope.fromOnly = "";
        $scope.fromToInitalDate = "";
        $scope.fromToEndDate = "";

        $http.get(couchInstanceURL + viewRoute)
            .success(function(data, status){
                console.log('successful retrieval of data');

                var extractedData = [];

                //extract objects
                for(var i = 0; i<data.rows.length; i++) {
                    extractedData.push(data.rows[i].value)
                }

                //sort the extractedData based on the dateTime
                extractedData.sort(function(a,b){
                    // Turn your strings into dates, and then subtract them
                    // to get a value that is either negative, positive, or zero.
                    return new Date(a.dateTime) - new Date(b.dateTime);
                });

                //get a list of the input names
                var keyList = [];

                //loop through each data row and grab all the unique keys that are available
                //except the dateTime variable. Currently the graph view does not have any idea of what
                //the inputs look like so we have to programmatically detect them.
                for(var i = 0; i <extractedData.length; i++) {
                    var tempKeyList = keyList;

                    //At the first index you need to compare the first entry to itself otherwise the union
                    //will return an empty result.
                    if(i === 0) {
                        keyList = _.union(Object.keys(extractedData[i]), Object.keys(extractedData[i]));
                    }
                    else {
                        keyList = _.union(tempKeyList, Object.keys(extractedData[i]));
                    }

                }

                //Remove the dateTime key from the keyList, that is x-axis data which
                //does not need its own series input
                for(var i = 0; i < keyList.length; i++) {
                    if(keyList[i] === 'dateTime') {
                        keyList.splice(i,i);
                    }
                }

                //create array entry for each input, then push it into a master array to keep track
                for(var i = 0; i < keyList.length; i++) {
                    allInputsObj[keyList[i]] = [];
                }

                //Loop through and parse data into a dataset that ChartJS can consume.
                for(var i = 0; i<extractedData.length; i++) {

                    for(var j = 0; j<keyList.length; j++) {
                        //check to make sure key exists, this isn't a guarantee for each data entry
                        var keyName = keyList[j];

                        if(extractedData[i][keyName] !== undefined) {
                            var date = new Date(extractedData[i].dateTime);
                            var utcDate = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
                            var tempArray = [utcDate, Number(extractedData[i][keyName])];
                            allInputsObj[keyName].push(tempArray);
                        }
                    }
                }

                setHighChartsData(allInputsObj);

            })
            .error(function(data, status) {

            }
        );

        $scope.filterHighChartData = function() {

            var allFilteredInputsObj = {};

            var keyList = Object.keys(allInputsObj);

            //create array entry for each input, then push it into a master array to keep track
            for(var i = 0; i < keyList.length; i++) {
                allFilteredInputsObj[keyList[i]] = [];
            }

            //Return all inputs if the 'all' option is selected
            if($scope.filterValue === 'all') {

                allFilteredInputsObj = allInputsObj;
            }


            if($scope.filterValue === 'from') {
                for(var i = 0; i<keyList.length; i++) {
                    var keyText = keyList[i];
                    for(var j = 0; j <allInputsObj[keyText].length; j++) {
                        var dateString = allInputsObj[keyText][j][0];
                        if(new Date(dateString) >= $scope.fromOnly) {
                            allFilteredInputsObj[keyText].push(allInputsObj[keyText][j]);
                        }
                    }
                }
            }

            if($scope.filterValue === 'fromTo') {

                for(var i = 0; i<keyList.length; i++) {
                    var keyText = keyList[i];
                    for(var j = 0; j <allInputsObj[keyText].length; j++) {
                        var dateString = allInputsObj[keyText][j][0];
                        if(new Date(dateString) >= $scope.fromToInitalDate && new Date(dateString) <= $scope.fromToEndDate) {
                            allFilteredInputsObj[keyText].push(allInputsObj[keyText][j]);
                        }
                    }
                }
            }

            setHighChartsData(allFilteredInputsObj);
        };

        function setHighChartsData(inputsObj) {

            Highcharts.setOptions({
                global: {
                    useUTC: false
                }
            });

            var setSeriesConfig =[];

            var inputsKeyList = Object.keys(inputsObj);

            for(var i = 0; i<inputsKeyList.length; i++) {
                var keyText = inputsKeyList[i];

                setSeriesConfig.push({
                    name: keyText,
                    data: inputsObj[keyText]
                });
            }

            $scope.highChartConfig = {
                options: {
                    chart: {
                        type: 'spline',
                        zoomType: 'x',
                        events: {
                            load: function() {
                                setInterval(function () {

                                    //get the most recent date to pass as a filter to the couch db instance
                                    //TODO: Make this a generic thing rather than specifying input 1
                                    var lastIndex = allInputsObj['input 1'].length;

                                    var latestDate = new Date(allInputsObj['input 1'][lastIndex-1][0]).toISOString();

                                    //get Latest data
                                    $http.get(couchInstanceURL + viewRoute + '?startkey="' + latestDate + "\"")
                                        .success(function(data, status){
                                            var extractedData = [];

                                            //extract objects
                                            for(var i = 0; i<data.rows.length; i++) {
                                                extractedData.push(data.rows[i].value)
                                            }

                                            //sort the extractedData based on the dateTime
                                            extractedData.sort(function(a,b){
                                                // Turn your strings into dates, and then subtract them
                                                // to get a value that is either negative, positive, or zero.
                                                return new Date(a.dateTime) - new Date(b.dateTime);
                                            });

                                            //TODO: THe couchdb db will return a duplicate date, the one that was used to form the query in the first place. Need to remove it so
                                            //duplicate data doesn't get added to the chart

                                            //get the most recent date to pass as a filter to the couch db instance
                                            var lastIndex = allInputsObj['input 1'].length;
                                            var latestDate = new Date(allInputsObj['input 1'][lastIndex-1][0]);

                                            var extractedLatestDate = new Date(extractedData[0]['dateTime']);

                                            /*
                                             * For some reason that I haven't figured out yet the date that is retrieved that is a duplicate from the CouchDB server
                                             * is off by a half second from the one that is still stored on the browser client, this makes it hard to compare by converting the
                                             * date object to a straight ISO 8601 format or get using the getTime() function. It's a bit hackey if you compare the times by
                                             * their getUTC components and skip the millsecond compare then in the meantime it should be an accurate comparison.
                                             */

                                            var isYear = latestDate.getUTCFullYear() === extractedLatestDate.getUTCFullYear();
                                            var isMonth = latestDate.getUTCMonth() === extractedLatestDate.getUTCMonth();
                                            var isDay = latestDate.getUTCDay() === extractedLatestDate.getUTCDay();
                                            var isHour = latestDate.getUTCHours() === extractedLatestDate.getUTCHours();
                                            var isMinute = latestDate.getUTCMinutes() === extractedLatestDate.getUTCMinutes();
                                            var isSeconds = latestDate.getUTCSeconds() === extractedLatestDate.getUTCSeconds();

                                            if(isYear && isMonth && isDay && isHour && isMinute && isSeconds) {
                                                //remove the first element to prevent duplicate data when necessary
                                                extractedData.splice(0, 1);
                                            }

                                            //get a list of the input names
                                            var keyList = [];

                                            //loop through each data row and grab all the unique keys that are available
                                            //except the dateTime variable
                                            for(var i = 0; i <extractedData.length; i++) {
                                                var tempKeyList = keyList;

                                                if(i === 0) {
                                                    keyList = _.union(Object.keys(extractedData[i]), Object.keys(extractedData[i]));
                                                }
                                                else {
                                                    keyList = _.union(tempKeyList, Object.keys(extractedData[i]));
                                                }

                                            }

                                            //Remove the dateTime key from the keyList, that is x-axis data which
                                            //does not need its own series input

                                            for(var i = 0; i < keyList.length; i++) {
                                                if(keyList[i] === 'dateTime') {
                                                    keyList.splice(i,i);
                                                }
                                            }

                                            //get the highchart series data
                                            var chartSeries = $('#chart1').highcharts().series;

                                            //Loop through and parse data into a dataset that ChartJS can consume.
                                            for(var i = 0; i<extractedData.length; i++) {

                                                for(var j = 0; j<keyList.length; j++) {
                                                    //check to make sure key exists, this isn't a guarantee for each data entry
                                                    var keyName = keyList[j];

                                                    if(extractedData[i][keyName] !== undefined) {

                                                        var date = new Date(extractedData[i].dateTime);
                                                        var utcDate = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
                                                        var tempArray = [utcDate, Number(extractedData[i][keyName])];

                                                        //Need to push into the master array and then dynamically add it to the chart
                                                        allInputsObj[keyName].push(tempArray);


                                                        /*TODO: check for date filters adding them to the current chart. Make sure that they are within the current
                                                        *       filter settings.
                                                        * */

                                                        //find the correct series by matching the input name to the series name
                                                        chartSeries.forEach(function(series) {
                                                            if(series.name === keyName) {
                                                                series.addPoint(tempArray);
                                                            }
                                                        });
                                                    }
                                                }
                                            }
                                        })
                                        .error(function(data, status) {

                                        });
                                }, 15000);
                            }
                        }
                    }
                },
                xAxis: {
                    type: 'datetime',
                    dateTimeLabelFormats: {
                        day: '%b %e. %H:%M:'
                    },
                    title: {
                        text: 'DateTime'
                    }
                },
                series: setSeriesConfig,
                title: {
                    text: 'Hello'
                },
                loading: false
            }
        };
    });
})();