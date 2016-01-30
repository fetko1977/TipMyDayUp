(function () {
    "use strict";

    var tipMyDayUpApp = angular.module("tipMyDayUpApp", ["ionic", "tipMyDayUpApp.controllers", "tipMyDayUpApp.services"]);


    tipMyDayUpApp.run(function ($ionicPlatform) {
        $ionicPlatform.ready(function () {
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
        });
    }).config(function ($stateProvider, $urlRouterProvider) {
            $stateProvider
            .state("tipMyDayUpApp", {
                url: "/app",
                abstract: true,
                templateUrl: "app/templates/view-menu.html",
                controller: "appCtrl"
            })
            .state("tipMyDayUpApp.home", {
                url: "/today-tips",
                templateUrl: "app/templates/view-home.html",
                controller: "homeCtrl"
            })
            .state("tipMyDayUpApp.tipsByDate", {
                url: "/tips-by-date",
                templateUrl: "app/templates/view-tips-by-date.html",
                controller: "tipsByDateCtrl"
            })
            .state("tipMyDayUpApp.tipsByCoefficient", {
                url: "/tips-by-coefficient",
                templateUrl: "app/templates/view-tips-by-coefficient.html",
                controller: "tipsByCoefficientCtrl"
            });
            $urlRouterProvider.otherwise("/app/today-tips");
        });
})();