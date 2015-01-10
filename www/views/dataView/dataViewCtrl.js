(function() {
    'use strict';

    var app = angular.module('InstrumentClient');

    app.controller('dataViewCtrl', function($scope, $http) {
        var couchInstanceURL = localStorage['cachedUrl'] + '/' + localStorage['couchDBInstance'];

        //This is a pre-defined view on the couchdb instance that returns the requested variables
        var viewRoute = '/_design/all_readings/_view/Readings';

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
                            var date = new Date(extractedData[i].dateTime).toLocaleString();
                            var tempArray = [date, Number(extractedData[i][keyName])];
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

                /*
                for(var i = 0; i<allInput1.length; i++) {
                    if (allInput1[i][0] >= $scope.fromToInitalDate && allInput1[i][0] <= $scope.fromToEndDate) {
                        filteredInput1.push(allInput1[i]);
                    }
                }
                for(var i = 0; i<allInput2.length; i++) {
                    if (allInput2[i][0] >= $scope.fromToInitalDate && allInput2[i][0] <= $scope.fromToEndDate) {
                        filteredInput2.push(allInput2[i]);
                    }
                }
                for(var i = 0; i<allInput3.length; i++) {
                    if(allInput3[i][0] >= $scope.fromToInitalDate && allInput3[i][0] <= $scope.fromToEndDate) {
                        filteredInput3.push(allInput2[i]);
                    }
                }
                */
            }

            setHighChartsData(allFilteredInputsObj);
        };

        function setHighChartsData(inputsObj) {

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
                        zoomType: 'x'
                    }
                },
                xAxis: {
                    type: 'datetime',
                    //labels: { step: '5'},
                    title: {
                        text: 'DateTime'
                    }
                },
                series: setSeriesConfig,
                title: {
                    text: 'Hello'
                },
                //xAxis: {currentMin: 0, currentMax: 10, minRange: 1},
                loading: false
            }
        };
    });
})();