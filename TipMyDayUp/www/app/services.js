(function () {
    "use strict";

    var servicesModule = angular.module("tipMyDayUpApp.services", []);

    //Service for Authorization
    servicesModule.factory("authorizationService", [function () {
        return {
            getAuthorized: function () {
                var PARSE_APP_ID = "YybIkFE2xTV4w3JAZYnRNLWELhA1nLglmlxqH9oh";
                var PARSE_REST_API_KEY = "gqvb52ROdHhcav4lAq7vx0qvuYQNXROWOb7u3nLB";

                return {
                    "X-Parse-Application-Id": PARSE_APP_ID,
                    "X-Parse-REST-API-Key": PARSE_REST_API_KEY
                }
            }
        }
    }]);

    //Service for all XMLHttpRequests
    servicesModule.factory("XMLHttpRequestService", ["$http", "authorizationService", function ($http, authorizationService) {
        return {
            get: function (url, params) {
                var config = {
                    method: 'GET',
                    headers: authorizationService.getAuthorized(),
                    url: url,
                    params: params
                }

                return $http(config);
            }
        }
    }]);

    //Service for helper functions
    servicesModule.factory("myappService", ["$rootScope", "$http", "$q", "$filter", "authorizationService", function ($rootScope, $http, $q, $filter, authorizationService) {
        var myappService = {};

        //starts and stops the application waiting indicator
        myappService.wait = function (show) {
            if (show)
                $(".spinner").show();
            else
                $(".spinner").hide();
        };

        //Function to check if element exists in collection
        myappService.isElementExists = function (element, collection) {
            return $.inArray(element, collection);
        }

        //Boolean Function to compare two dates
        myappService.isEqualDates = function (dateFirst, dateSeccond) {
            if (dateFirst.getDate() === dateSeccond.getDate() && dateFirst.getMonth() === dateSeccond.getMonth() && dateFirst.getFullYear === dateSeccond.getFullYear) {
                return true;
            }
            return false;
        };

        // Format Tip Data
        myappService.formatTipData = function (tip) {
            var competitionObjectId = tip.competition.objectId;
            var homeTeamObjectId = tip.homeTeam.objectId;
            var guestTeamObjectId = tip.guestTeam.objectId;

            var tipContent = tip.tipContent;
            var coefficient = tip.coefficient;

            var currentTip = {};

            currentTip.tipContent = tipContent;

            currentTip.startTime = tip.gameStart.iso;

            currentTip.coefficient = coefficient;

            currentTip.status = tip.status.toLowerCase().replace(/\b[a-z]/g, function (letter) {
                return letter.toUpperCase();
            });

            currentTip.statusClass = tip.status;

            currentTip.tipResult = tip.tipResult;

            var homeTeamPromise = getTeamById(homeTeamObjectId);
            var guestTeamPromise = getTeamById(guestTeamObjectId);
            var competitionPromise = getCompetitionById(competitionObjectId);
            var resultPromise = getTipResultByTipId(tip.objectId);

            resultPromise.then(function (resultData) {
                currentTip.homeTeamGoals = resultData.homeTeamGoals;
                currentTip.guestTeamGoals = resultData.guestTeamGoals;
            });

            competitionPromise.then(function (competitonData) {
                currentTip.competition = competitonData;
            });

            homeTeamPromise.then(function (team) {
                currentTip.homeTeam = team;
            });

            guestTeamPromise.then(function (team) {
                currentTip.guestTeam = team;
            });

            return currentTip;
        }

        // Get All Tips
        myappService.getAllTips = function (params) {
            var getTipsConfig = {
                method: 'GET',
                headers: authorizationService.getAuthorized(),
                url: 'https://api.parse.com/1/classes/Tip',
                params: params
            }
            return $http(getTipsConfig);
        };

        // Get All Results
        myappService.getAllResults = function (params) {
            var getResultsConfig = {
                method: 'GET',
                headers: authorizationService.getAuthorized(),
                url: 'https://api.parse.com/1/classes/Result',
                params: params
            }
            return $http(getResultsConfig);
        };

        //Get Team by Object ID
        var getTeamById = function (id) {
            var teamByIdUrl = 'https://api.parse.com/1/classes/Team/' + id;
            var deferred = $q.defer();

            $http({
                method: 'GET',
                headers: authorizationService.getAuthorized(),
                url: teamByIdUrl
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (msg, code) {
                deferred.reject(msg);
            });
            return deferred.promise;
        }

        //Get Competition by Object ID
        var getCompetitionById = function (id) {
            var competitionByIdUrl = 'https://api.parse.com/1/classes/Competition/' + id;
            var deferred = $q.defer();

            $http({
                method: 'GET',
                headers: authorizationService.getAuthorized(),
                url: competitionByIdUrl
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (msg, code) {
                deferred.reject(msg);
            });
            return deferred.promise;
        }

        // Get result by tip id
        var getTipResultByTipId = function (tipId) {
            var deferred = $q.defer();

            var params = {
                id: tipId
            };

            myappService.getAllResults(params).success(function (resultData) {
                var resultsCollection = resultData.results;

                resultsCollection.forEach(function (result) {
                    var searchedTipResultId = params.id;
                    var currentTipResultId = result.tip.objectId;

                    if (searchedTipResultId === currentTipResultId) {
                        deferred.resolve(result);
                    }
                });

            }).error(function (msg, code) {
                deferred.reject(msg);
            });
            return deferred.promise;
        }

        // Get All Tips Dates
        myappService.getTipsDates = function () {
            var deferred = $q.defer();

            myappService.getAllTips().success(function (returnedTipsData) {
                var tipsDatesCollection = Array();
                var returnedTips = returnedTipsData.results;

                returnedTips.forEach(function (returnedTip) {
                    var returnedTipGameDate = returnedTip.gameStart.iso;
                    var tipsDate = new Date(returnedTipGameDate);
                    var filteredTipsGameDate = $filter('date')(tipsDate, 'dd MMM yyyy', '+0200');
                    

                    if ($.inArray(filteredTipsGameDate, tipsDatesCollection) == -1) {
                        tipsDatesCollection.push(filteredTipsGameDate);
                    }
                })

                //Sort
                tipsDatesCollection.sort(function (a, b) { return new Date(b).getTime() - new Date(a).getTime() });

                //Resolve
                deferred.resolve(tipsDatesCollection);
            }).error(function (msg, code) {
                deferred.reject(msg);
            });
            return deferred.promise;
        }

        // Get All Tips Coefficients
        myappService.getTipsCoefficients = function () {
            var deferred = $q.defer();

            myappService.getAllTips().success(function (returnedTipsData) {
                var tipsCoefficientsCollection = Array();
                var returnedTips = returnedTipsData.results;

                returnedTips.forEach(function (returnedTip) {

                    var tipCoefficient = returnedTip.coefficient;

                    if (myappService.isElementExists(tipCoefficient, tipsCoefficientsCollection) == -1) {
                        tipsCoefficientsCollection.push(tipCoefficient);
                    }
                })

                tipsCoefficientsCollection.sort(function (a, b) { return a - b });

                deferred.resolve(tipsCoefficientsCollection);
            }).error(function (msg, code) {
                deferred.reject(msg);
            });
            return deferred.promise;
        }

        // Get Today Tips Coefficients
        myappService.getTodayTipsCoefficients = function () {
            var deferred = $q.defer();

            myappService.getAllTips().success(function (returnedTipsData) {
                var todayTipsCoefficientsCollection = Array();
                var returnedTips = returnedTipsData.results;

                returnedTips.forEach(function (returnedTip) {
                    var tipDate = new Date(returnedTip.gameStart.iso);
                    var todayDate = new Date();

                    if (myappService.isEqualDates(tipDate, todayDate)) {
                        var tipCoefficient = returnedTip.coefficient;

                        if (myappService.isElementExists(tipCoefficient, todayTipsCoefficientsCollection) == -1) {
                            todayTipsCoefficientsCollection.push(tipCoefficient);
                        }
                    }
                })

                todayTipsCoefficientsCollection.sort(function (a, b) { return a - b });

                deferred.resolve(todayTipsCoefficientsCollection);
            }).error(function (msg, code) {
                deferred.reject(msg);
            });
            return deferred.promise;
        }

        return myappService;
    }]);

    //Service to get tips data
    servicesModule.factory("getTipsDataService", ["$rootScope", "$http", "$q", "$filter", "XMLHttpRequestService", "myappService", function ($rootScope, $http, $q, $filter, XMLHttpRequestService, myappService) {
        return {

            getAllTips: function(){
                var deferred = $q.defer();

                var url = 'https://api.parse.com/1/classes/Tip';

                XMLHttpRequestService.get(url).success(function (returnedTipsData) {
                    deferred.resolve(returnedTipsData);
                }).error(function (msg, code) {
                    deferred.reject(msg);
                });
                return deferred.promise;
            },

            getTodayTips: function () {
                var deferred = $q.defer();

                var url = 'https://api.parse.com/1/classes/Tip';

                XMLHttpRequestService.get(url).success(function (returnedTipsData) {
                    var tipsCollection = Array();
                    var returnedTips = returnedTipsData.results;
                    //console.log(returnedTips);
                    returnedTips.forEach(function (returnedTip) {
                        var gameDate = returnedTip.gameStart.iso;
                        var gameDateStart = new Date(gameDate);
                        var todayDate = new Date();

                        if (myappService.isEqualDates(gameDateStart, todayDate)) {

                            var currentTip = myappService.formatTipData(returnedTip);

                            tipsCollection.push(currentTip);
                        }

                    })
                    //console.log(tipsCollection);
                    deferred.resolve(tipsCollection);
                }).error(function (msg, code) {
                    deferred.reject(msg);
                });
                return deferred.promise;
            },

            getTipsByDate: function () {
                var deferred = $q.defer();

                var url = 'https://api.parse.com/1/classes/Tip';

                XMLHttpRequestService.get(url).success(function (returnedTipsData) {
                    var tipsByDateCollection = Array();
                    var returnedTips = returnedTipsData.results;

                    returnedTips.forEach(function (returnedTip) {
                        var selectedDateValue = $('#tipDateSelector').val();
                        var gameDate = returnedTip.gameStart.iso;
                        var gameDateStart = new Date(gameDate);
                        var paramsDate = new Date(selectedDateValue);

                        if (myappService.isEqualDates(gameDateStart, paramsDate)) {

                            var currentTip = myappService.formatTipData(returnedTip);

                            tipsByDateCollection.push(currentTip);
                        }

                    })

                    deferred.resolve(tipsByDateCollection);
                }).error(function (msg, code) {
                    deferred.reject(msg);
                });
                return deferred.promise;
            },

            getTipsByCoefficient: function () {
                var deferred = $q.defer();

                var url = 'https://api.parse.com/1/classes/Tip';

                XMLHttpRequestService.get(url).success(function (returnedTipsData) {
                    var tipsByCoefficientCollection = Array();
                    var returnedTips = returnedTipsData.results;

                    returnedTips.forEach(function (returnedTip) {
                        var selectedCoefficientValue = $('#tipCoefficientSelector').val();
                        var tipCoefficient = returnedTip.coefficient;

                        if (selectedCoefficientValue == tipCoefficient) {

                            var currentTip = myappService.formatTipData(returnedTip);

                            tipsByCoefficientCollection.push(currentTip);
                        }

                    })

                    deferred.resolve(tipsByCoefficientCollection);
                }).error(function (msg, code) {
                    deferred.reject(msg);
                });
                return deferred.promise;
            },

            getTodayTipsByCoefficient: function () {
                var deferred = $q.defer();

                var url = 'https://api.parse.com/1/classes/Tip';

                XMLHttpRequestService.get(url).success(function (returnedTipsData) {
                    var todayTipsByCoefficientCollection = Array();
                    var returnedTips = returnedTipsData.results;

                    returnedTips.forEach(function (returnedTip) {
                        var returnedTipDate = new Date(returnedTip.gameStart.iso);
                        var todayDate = new Date();

                        if (myappService.isEqualDates(returnedTipDate, todayDate)) {
                            var selectedCoefficientValue = $('#todayTipCoefficientSelector').val();
                            //console.log(selectedCoefficientValue);
                            var tipCoefficient = returnedTip.coefficient;

                            if (selectedCoefficientValue == 0) {
                                selectedCoefficientValue = tipCoefficient;
                            }

                            if (selectedCoefficientValue == tipCoefficient) {

                                var currentTip = myappService.formatTipData(returnedTip);

                                todayTipsByCoefficientCollection.push(currentTip);
                            }
                        }
                    })

                    deferred.resolve(todayTipsByCoefficientCollection);
                }).error(function (msg, code) {
                    deferred.reject(msg);
                });
                return deferred.promise;
            }
        }
    }]);
})();