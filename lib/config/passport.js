'use strict';

var config = require('./oauth.js');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GithubStrategy = require('passport-github').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var DropboxStrategy = require('passport-dropbox-oauth2').Strategy;

/**
 * Passport configuration
 */
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findOne({
    _id: id
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    done(err, user);
  });
});

// add other strategies for more authentication flexibility
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password' // this is the virtual field on the model
  },
  function(email, password, done) {
    User.findOne({
      'local.emails': { $in: value }
    }, function(err, user) {
      if (err) return done(err);
      
      if (!user) {
        return done(null, false, {
          message: 'This email is not registered.'
        });
      }
      if (!user.authenticate(password)) {
        return done(null, false, {
          message: 'This password is not correct.'
        });
      }
      return done(null, user);
    });
  }
));

//Facebook
passport.use(new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    callbackURL: config.facebook.callbackURL
  },
  function(token, refreshToken, profile, done) {

    // asynchronous
    process.nextTick(function() {

      // find the user in the database based on their facebook id
      User.findOne({ 'facebook.id' : profile.id }, function(err, user) {

        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err)
          return done(err);

        // if the user is found, then log them in
        if (user) {
          return done(null, user); // user found, return that user
        } else {
          // if there is no user found with that facebook id, create them
          var newUser = new User();

          // set all of the facebook information in our user model
          newUser.facebook.id    = profile.id; // set the users facebook id                 
          newUser.facebook.token = token; // we will save the token that facebook provides to the user                  
          newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
          var emails = [];
          profile.emails.forEach(function(email) {
            emails.push(email.value)
          });
          newUser.facebook.emails = emails; // facebook can return multiple emails so we'll take the first
          newUser.emails = emails;
          newUser.provider = 'facebook';

          // save our user to the database
          newUser.save(function(err) {
            if (err)
              throw err;

            // if successful, return the new user
            return done(null, newUser);
          });
        }
      });
    });
  }
));

//Dropbox
passport.use(new DropboxStrategy({
    clientID: config.dropbox.clientID,
    clientSecret: config.dropbox.clientSecret,
    callbackURL: config.dropbox.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous
    process.nextTick(function() {

      // find the user in the database based on their dropbox username
      User.findOne({ 'dropbox.id' : profile.id }, function(err, user) {
        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err)
          return done(err);

        // if the user is found, then log them in
        if (user) {
          return done(null, user); // user found, return that user
        } else {
          // if there is no user found with that dropbox username, create them
          var newUser = new User();

          // set all of the dropbox information in our user model
          newUser.dropbox.id    = profile.id; // set the users dropbox id 
          newUser.dropbox.displayName = profile.displayName;
          var emails = [];
          profile.emails.forEach(function(email) {
            emails.push(email.value)
          });      
          newUser.dropbox.emails = emails;
          newUser.emails = emails;
          newUser.provider = 'dropbox';

          // save our user to the database
          newUser.save(function(err) {
            if (err)
              throw err;

            // if successful, return the new user
            return done(null, newUser);
          });
        }
      });
    });
  }
));

//Github
passport.use(new GithubStrategy({
    clientID: config.github.clientID,
    clientSecret: config.github.clientSecret,
    callbackURL: config.github.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous
    process.nextTick(function() {

      // find the user in the database based on their github username
      User.findOne({ 'github.id' : profile.username }, function(err, user) {
        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err)
          return done(err);

        // if the user is found, then log them in
        if (user) {
          return done(null, user); // user found, return that user
        } else {
          // if there is no user found with that github username, create them
          var newUser = new User();

          // set all of the github information in our user model
          newUser.github.id    = profile.username; // set the users github id    
          newUser.github.token = profile.token; // set the users github token   
          var emails = [];
          profile.emails.forEach(function(email) {
            emails.push(email.value)
          });               
          newUser.github.email = emails;
          newUser.emails = emails;
          newUser.provider = 'github';


          // save our user to the database
          newUser.save(function(err) {
            if (err)
              throw err;

            // if successful, return the new user
            return done(null, newUser);
          });
        }
      });
    });
  }
));

//Google
passport.use(new GoogleStrategy({
    clientID        : config.google.clientID,
    clientSecret    : config.google.clientSecret,
    callbackURL     : config.google.callbackURL,
  },
  function(token, refreshToken, profile, done) {

  // make the code asynchronous
  // User.findOne won't fire until we have all our data back from Google
  process.nextTick(function() {

    // try to find the user based on their google id
    User.findOne({ 'google.id' : profile.id }, function(err, user) {
      if (err)
        return done(err);

      if (user) {
        // if a user is found, log them in
        return done(null, user);
      } else {
        // if the user isnt in our database, create a new user
        var newUser          = new User();

        // set all of the relevant information
        newUser.google.id    = profile.id;
        newUser.google.token = profile.token;
        newUser.google.name  = profile.displayName;
        var emails = [];
        profile.emails.forEach(function(email) {
          emails.push(email.value)
        });  
        newUser.google.emails = emails; 
        newUser.emails = emails;
        newUser.provider = 'google'

        // save the user
        newUser.save(function(err) {
          if (err)
            throw err;
          return done(null, newUser);
        });
      }
    });
  });
}));

module.exports = passport;
