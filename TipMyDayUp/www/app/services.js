(function () {
    "use strict";

    angular.module("tipMyDayUpApp.services", []).factory("myappService", ["$rootScope", "$http", "$q", "$filter", function ($rootScope, $http, $q, $filter) {
        var myappService = {};

        //starts and stops the application waiting indicator
        myappService.wait = function (show) {
            if (show)
                $(".spinner").show();
            else
                $(".spinner").hide();
        };

        // Authorization Headers for Parse
        myappService.authorizationConfig = function () {
            var PARSE_APP_ID = "YybIkFE2xTV4w3JAZYnRNLWELhA1nLglmlxqH9oh";
            var PARSE_REST_API_KEY = "gqvb52ROdHhcav4lAq7vx0qvuYQNXROWOb7u3nLB";

            return {
                "X-Parse-Application-Id": PARSE_APP_ID,
                "X-Parse-REST-API-Key": PARSE_REST_API_KEY
            }
        };

        //Function to check if element exists in collection
        var isElementExists = function (element, collection) {
            return $.inArray(element, collection);
        }

        //Boolean Function to compare two dates
        var isEqualDates = function (dateFirst, dateSeccond) {
            if (dateFirst.getDate() === dateSeccond.getDate() && dateFirst.getMonth() === dateSeccond.getMonth() && dateFirst.getFullYear === dateSeccond.getFullYear) {
                return true;
            }
            return false;
        };

        // Format Tip Data
        var formatTipData = function (tip) {
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
                headers: myappService.authorizationConfig(),
                url: 'https://api.parse.com/1/classes/Tip',
                params: params
            }
            return $http(getTipsConfig);
        };

        // Get All Results
        myappService.getAllResults = function (params) {
            var getResultsConfig = {
                method: 'GET',
                headers: myappService.authorizationConfig(),
                url: 'https://api.parse.com/1/classes/Result',
                params: params
            }
            return $http(getResultsConfig);
        };



        // Get Today Tips
        myappService.getTodayTips = function (success) {
            var deferred = $q.defer();
            
            myappService.getAllTips().success(function (returnedTipsData) {
                var tipsCollection = Array();
                var returnedTips = returnedTipsData.results;
                //console.log(returnedTips);
                returnedTips.forEach(function (returnedTip) {
                    var gameDate = returnedTip.gameStart.iso;
                    var gameDateStart = new Date(gameDate);
                    var todayDate = new Date();

                    if (isEqualDates(gameDateStart, todayDate)) {
                        
                        var currentTip = formatTipData(returnedTip)

                        tipsCollection.push(currentTip);
                    }

                })

                deferred.resolve(tipsCollection);
            }).error(function (msg, code) {
                deferred.reject(msg);
            });
            return deferred.promise;
        }

        //Get Team by Object ID
        var getTeamById = function (id) {
            var teamByIdUrl = 'https://api.parse.com/1/classes/Team/' + id;
            var deferred = $q.defer();

            $http({
                method: 'GET',
                headers: myappService.authorizationConfig(),
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
                headers: myappService.authorizationConfig(),
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
        myappService.getTipsDates = function(){
            var deferred = $q.defer();

            myappService.getAllTips().success(function (returnedTipsData) {
                var tipsDatesCollection = Array();
                var returnedTips = returnedTipsData.results;
                
                returnedTips.forEach(function (returnedTip) {
                    var gameDate = returnedTip.gameStart.iso;
                    var tipsDate = new Date(gameDate);
                    
                    if (isElementExists(tipsDate, tipsDatesCollection) == -1) {
                        tipsDatesCollection.push(tipsDate);
                    }
                })
                tipsDatesCollection.sort(function (a, b) { return b.getTime() - a.getTime() });
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

                    if (isElementExists(tipCoefficient, tipsCoefficientsCollection) == -1) {
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

        // Get tips by date
        myappService.getTipsByDate = function (date) {
            var deferred = $q.defer();

            var params = {
                data: date
            };

            myappService.getAllTips(params).success(function (returnedTipsData) {
                var tipsCollection = Array();
                var returnedTips = returnedTipsData.results;

                returnedTips.forEach(function (tip) {
                    var searchedDate = new Date(params.data);
                    var tipDate = new Date(tip.gameStart.iso);

                    if (isEqualDates(searchedDate, tipDate)) {
                        var currentTip = formatTipData(tip)

                        tipsCollection.push(currentTip);
                    }
                });

                deferred.resolve(tipsCollection);
            }).error(function (msg, code) {
                deferred.reject(msg);
            });
            return deferred.promise;
        };

        // Get tips by coefficient
        myappService.getTipsByCoefficient = function (coefficient) {
            var deferred = $q.defer();

            var params = {
                coefficient: coefficient
            };

            myappService.getAllTips(params).success(function (returnedTipsData) {
                var tipsCollection = Array();
                var returnedTips = returnedTipsData.results;

                returnedTips.forEach(function (tip) {
                    var searchedCoefficient = params.coefficient;
                    var tipCoefficient = tip.coefficient;

                    if (searchedCoefficient == tipCoefficient) {
                        var currentTip = formatTipData(tip)

                        tipsCollection.push(currentTip);
                    }
                });

                deferred.resolve(tipsCollection);
            }).error(function (msg, code) {
                deferred.reject(msg);
            });
            return deferred.promise;
        };

        return myappService;
    }]);
})();