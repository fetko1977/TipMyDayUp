(function () {
    "use strict";

    angular.module("tipMyDayUpApp.controllers", [])

    .controller("appCtrl", ["$scope", function ($scope) {
        $scope.isMenuOpen = function () {
            var body = $("body");
            return body.hasClass("menu-open");
        }
    }])

    //homeCtrl provides the logic for the home screen
    .controller("homeCtrl", ["$scope", "$state", "myappService", "getTipsDataService", function ($scope, $state, myappService, getTipsDataService) {
        $scope.todayDate = new Date();

        //Getting latest tips
        getTipsDataService.getTodayTips().then(function (tips) {
            $scope.tips = tips;
        });

        $scope.refresh = function () {
            //refresh binding
            $scope.$broadcast("scroll.refreshComplete");

            //Getting latest tips
            getTipsDataService.getTodayTips().then(function (tips) {
                $scope.tips = tips;
            });
        };
    }])

    //errorCtrl managed the display of error messages bubbled up from other controllers, directives, myappService
    .controller("errorCtrl", ["$scope", "myappService", function ($scope, myappService) {
        //public properties that define the error message and if an error is present
        $scope.error = "";
        $scope.activeError = false;

        //function to dismiss an active error
        $scope.dismissError = function () {
            $scope.activeError = false;
        };

        //broadcast event to catch an error and display it in the error section
        $scope.$on("error", function (evt, val) {
            //set the error message and mark activeError to true
            $scope.error = val;
            $scope.activeError = true;

            //stop any waiting indicators (including scroll refreshes)
            myappService.wait(false);
            $scope.$broadcast("scroll.refreshComplete");

            //manually apply given the way this might bubble up async
            $scope.$apply();
        });
    }])

    //tipsByDateCtrl managed the display of tips filtered by date
    .controller("tipsByDateCtrl", ["$scope", "myappService", "$filter", "getTipsDataService", function ($scope, myappService, $filter, getTipsDataService) {
        // Load a tips dates based on existing tips in the database
        var tipsDatesPromise = myappService.getTipsDates();

        // Handling the tips dates promise
        tipsDatesPromise.then(function (tipsDatesData) {
            var tipsDatesCollection = Array();
            tipsDatesData.forEach(function (tipsDate) {
                var filteredTipsDate = $filter('date')(tipsDate, 'dd MMM yyyy', '+0200');
                tipsDatesCollection.push(filteredTipsDate);
            });
            $scope.selectedDate = tipsDatesCollection[0];
            $scope.tipsDates = tipsDatesCollection;
        });

        // Returns promise with tips collection based on date
        var getTipsBySelectedDate = function () {
            return getTipsDataService.getTipsByDate();
        };

        // Handling the tips by date promise
        getTipsBySelectedDate().then(function (tipsByDateData) {
            $scope.tipsByDate = tipsByDateData;
        });

        // Load a tips based on selected date
        $scope.getTipsByDate = function () {
            getTipsBySelectedDate().then(function (tipsByDateData) {
                $scope.tipsByDate = tipsByDateData;
            });
        };

        $scope.refresh = function () {
            getTipsBySelectedDate().then(function (tipsByDateData) {
                $scope.tipsByDate = tipsByDateData;
            });
        }
    }])

    //tipsByCoefficientCtrl managed the display of tips filtered by coefficient
    .controller("tipsByCoefficientCtrl", ["$scope", "myappService", "$filter", "getTipsDataService", function ($scope, myappService, $filter, getTipsDataService) {
        var getTipsBySelectedCoefficient = function () {
            return getTipsDataService.getTipsByCoefficient();
        }

        // Load a tips coefficients based on existing tips in the database
        var tipsCoefficientsPromise = myappService.getTipsCoefficients();

        tipsCoefficientsPromise.then(function (tipsCoefficientsData) {
            //console.log(tipsCoefficientsData);
            $scope.coefficientSelector = tipsCoefficientsData[0];
            $scope.tipsCoefficients = tipsCoefficientsData;
        });

        getTipsBySelectedCoefficient().then(function (tipsByCoefficientData) {
            $scope.tipsByCoefficient = tipsByCoefficientData;
        });

        // Gets tips based on selected coefficient when user change input - ng-change directive
        $scope.getTipsByCoefficient = function () {
            getTipsBySelectedCoefficient().then(function (tipsByCoefficientData) {
                $scope.tipsByCoefficient = tipsByCoefficientData;
            });
        }

        $scope.refresh = function () {
            getTipsBySelectedCoefficient().then(function (tipsByCoefficientData) {
                $scope.tipsByCoefficient = tipsByCoefficientData;
            });
        }
    }]);
})();