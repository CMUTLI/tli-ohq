/*
 * Initialize angular app
 */
var app = angular.module("queue", ["ngCsvImport","ngRoute","angular-blocks","ui.materialize","materialize-tooltip-enhancement","angularMoment","chart.js","LocalStorageModule"]);

/*
 * Register factories
 */
app.factory("$db",db);

/*
 * Register controllers
 */
app.controller("landing_ctl",landing_ctl);
app.controller("student_ctl",student_ctl);
app.controller("ca_ctl",ca_ctl);
app.controller("stats_ctl",stats_ctl);
app.controller("login_ctl",login_ctl);
app.controller("admin_ctl",admin_ctl);
app.controller("course_admin_ctl", course_admin_ctl);
app.controller("account_ctl",account_ctl);

/*
 *  Setup routes
 */
app.config(function($routeProvider) {
    $routeProvider.when("/courses", {
        templateUrl : "html/landing.html",
        controller: "landing_ctl"
    });
    $routeProvider.when("/", {
        templateUrl : "html/login.html",
        controller: "login_ctl"
    });
    $routeProvider.when("/student", {
        templateUrl : "html/student.html",
        controller: "student_ctl"
    });
    $routeProvider.when("/ca", {
        templateUrl : "html/ca.html",
        controller: "ca_ctl"
    });
    $routeProvider.when("/ca/stats", {
        templateUrl : "html/stats.html",
        controller: "stats_ctl"
    });
    $routeProvider.when("/admin", {
        templateUrl : "html/admin.html",
        controller: "admin_ctl"
    });
    $routeProvider.when("/course_admin", {
        templateUrl : "html/course_admin.html",
        controller: "course_admin_ctl"
    });
    $routeProvider.when("/account", {
        templateUrl : "html/account.html",
        controller: "account_ctl"
    });
    $routeProvider.when("/deny", { templateUrl : "html/errors/deny.html" });
    $routeProvider.when("/404", { templateUrl : "html/errors/404.html" });
    $routeProvider.when("/500", { templateUrl : "html/errors/500.html" });
});


/*
 * Setup module parameters
 */
app.constant('amTimeAgoConfig', {
  titleFormat: 'ddd, MMM D [at] h:mm a',
});
