'use strict'

angular.module('monocleApp')
  .factory 'Session', ($resource) ->
    $resource '/api/session/'
