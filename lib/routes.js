'use strict';

var api = require('./controllers/api'),
    index = require('./controllers'),
    users = require('./controllers/users'),
    session = require('./controllers/session'),
    middleware = require('./middleware'),
    passport = require('passport');

/**
 * Application routes
 */
module.exports = function(app) {

  // Server API Routes
  app.route('/api/awesomeThings')
    .get(api.awesomeThings);
  
  app.route('/api/users')
    .post(users.create)
    .put(users.changePassword);
  app.route('/api/users/me')
    .get(users.me);
  app.route('/api/users/:id')
    .get(users.show);

  app.route('/api/session')
    .post(session.login)
    .delete(session.logout);

  app.route('/api/session/facebook')
    .get(passport.authenticate('facebook'));

  app.route('/api/session/github')
    .get(passport.authenticate('github', { scope : ['user:email'] }));

  app.route('/api/session/google')
    .get(passport.authenticate('google', { scope : ['profile', 'email'] }));

  app.route('/api/session/dropbox')
    .get(passport.authenticate('dropbox-oauth2'));

  app.route('/api/session/github/callback')
    .get(passport.authenticate('github', {
      successRedirect : '/',
      failureRedirect: '/login'}));

  app.route('/api/session/facebook/callback')
    .get(passport.authenticate('facebook', {
      successRedirect : '/',
      failureRedirect: '/login'}));

  app.route('/api/session/google/callback')
    .get(passport.authenticate('google', {
      successRedirect : '/',
      failureRedirect: '/login'}));

  app.route('/api/session/dropbox/callback')
    .get(passport.authenticate('dropbox-oauth2', {
      successRedirect : '/',
      failureRedirect: '/login'}));

  // All undefined api routes should return a 404
  app.route('/api/*')
    .get(function(req, res) {
      res.send(404);
    });

  // All other routes to use Angular routing in app/scripts/app.js
  app.route('/partials/*')
    .get(index.partials);
  app.route('/*')
    .get( middleware.setUserCookie, index.index);
};