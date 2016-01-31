(function () {
    "use strict";

    angular.module("tipMyDayUpApp.controllers", [])

    .controller("appCtrl", ["$scope", function ($scope) {
    }])

    //homeCtrl provides the logic for the home screen
    .controller("homeCtrl", ["$scope", "$state", "myappService", function ($scope, $state, myappService) {
        $scope.todayDate = new Date();

        //Getting latest tips as promise
        var getTodayTipsPromise = myappService.getTodayTips();
        
        //Attach it to the scope
        getTodayTipsPromise.then(function (tips) {
            $scope.tips = tips;
            //console.log($scope.tips);
        });

        $scope.refresh = function () {
            //refresh binding
            $scope.$broadcast("scroll.refreshComplete");
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
    .controller("tipsByDateCtrl", ["$scope", "myappService", "$filter", function ($scope, myappService, $filter) {
        // Load a tips based on selected date
        $scope.getTipsByDate = function () {
            var dateSelectValue = $('#tipDateSelector').val();
            
            var getTipsByDatePromise = myappService.getTipsByDate(dateSelectValue);
            
            getTipsByDatePromise.then(function (tipsByDateData) {
                $scope.tipsByDate = tipsByDateData;
            });
        };

        

        // Load a tips dates based on existing tips in the database
        var tipsDatesPromise = myappService.getTipsDates();
        tipsDatesPromise.then(function (tipsDatesData) {
            var tipsDatesCollection = Array();
            tipsDatesData.forEach(function (tipsDate) {
                var filteredTipsDate = $filter('date')(tipsDate, 'dd MMM yyyy', '+0200');
                tipsDatesCollection.push(filteredTipsDate);
            });
            
            $scope.tipsDates = tipsDatesCollection;
        });
    }])

    //tipsByCoefficientCtrl managed the display of tips filtered by coefficient
    .controller("tipsByCoefficientCtrl", ["$scope", "myappService", "$filter", function ($scope, myappService, $filter) {

        $scope.getTipsByCoefficient = function () {
            var coefficientSelectedValue = $('#tipCoefficientSelector').val();

            var getTipsByCoefficientPromise = myappService.getTipsByCoefficient(coefficientSelectedValue);
            getTipsByCoefficientPromise.then(function (tipsByCoefficientData) {
                $scope.tipsByCoefficient = tipsByCoefficientData;
            });

        }

        // Load a tips coefficients based on existing tips in the database
        var tipsCoefficientsPromise = myappService.getTipsCoefficients();
        tipsCoefficientsPromise.then(function (tipsCoefficientsData) {
            $scope.tipsCoefficients = tipsCoefficientsData;
        });
    }]);
})();