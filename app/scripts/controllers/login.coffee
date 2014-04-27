'use strict'

angular.module('monocleApp')
  .controller 'LoginCtrl', ($scope, Auth, $location) ->
    $scope.user = {}
    $scope.errors = {}

    $scope.login = (form) ->
      $scope.submitted = true
      
      if form.$valid
        Auth.login(
          email: $scope.user.email
          password: $scope.user.password
        )
        .then ->
          # Logged in, redirect to home
          $location.path '/'
        .catch (err) ->
          err = err.data;
          $scope.errors.other = err.message;

    $scope.loginFacebook = ->
      window.location.href = "http://localhost:9000/api/session/facebook"
    $scope.loginGithub = ->
      window.location.href = "http://localhost:9000/api/session/github"
    $scope.loginGoogle = ->
      window.location.href = "http://localhost:9000/api/session/google"

