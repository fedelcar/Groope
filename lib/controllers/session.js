'use strict';

var mongoose = require('mongoose'),
    passport = require('passport');

/**
 * Logout
 */
exports.logout = function (req, res) {
  req.logout();
  res.send(200);
};

/**
 * Login
 */
exports.login = function (req, res, next) {
  console.log(req);
  passport.authenticate('local', function(err, user, info) {
    var error = err || info;
    console.log(err + " " + info + " " + info);
    if (error) return res.json(401, error);

    req.logIn(user, function(err) {
      console.log(err + " " + info + " " + info);
      if (err) return res.send(err);
      res.json(req.user.userInfo);
    });
  })(req, res, next);
};