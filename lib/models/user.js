'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    crypto = require('crypto');
  
var authTypes = ['github', 'dropbox', 'facebook', 'google'];

/**
 * User Schema
 */
var UserSchema = new Schema({
  name: String,
  role: {
    type: String,
    default: 'user'
  },
  provider: String,
  emails: [{ type: String, lowercase: true }],
  local:{
    emails: [{ type: String, lowercase: true }],
    hashedPassword: String,
    salt: String
  },
  facebook: {
    id: String,
    token: String,
    emails: [{ type: String, lowercase: true }],
    name: String
  },
  dropbox: {
    id: String,
    displayName: String,
    emails: [{ type: String, lowercase: true }],
  },
  google: {
    id: String,
    token: String,
    emails: [{ type: String, lowercase: true }],
    name: String
  },
  github: {
    id: String,
    token: String,
    emails: [{ type: String, lowercase: true }]
  }
});

/**
 * Virtuals
 */
UserSchema
  .virtual('password')
  .set(function(password) {
    this._password = password;
    this.local.salt = this.makeSalt();
    this.local.hashedPassword = this.encryptPassword(password);
  })
  .get(function() {
    return this._password;
  });

// Basic info to identify the current authenticated user in the app
UserSchema
  .virtual('userInfo')
  .get(function() {
    return {
      'name': this.name,
      'role': this.role,
      'provider': this.provider
    };
  });

// Public profile information
UserSchema
  .virtual('profile')
  .get(function() {
    return {
      'name': this.name,
      'role': this.role
    };
  });
    
/**
 * Validations
 */

// Validate empty email
UserSchema
  .path('local.emails')
  .validate(function(email) {
    // if you are authenticating by any of the oauth strategies, don't validate
    if (authTypes.indexOf(this.provider) !== -1) return true;
    return email.length;
  }, 'Email cannot be blank');

// Validate empty password
UserSchema
  .path('local.hashedPassword')
  .validate(function(hashedPassword) {
    // if you are authenticating by any of the oauth strategies, don't validate
    if (authTypes.indexOf(this.provider) !== -1) return true;
    return hashedPassword.length;
  }, 'Password cannot be blank');

// Validate email is not taken
UserSchema
  .path('local.emails')
  .validate(function(value, respond) {
    var self = this;
    this.constructor.findOne({ 'local.emails': { $in: value } }, function(err, user) {
      if(err) throw err;
      if(user) {
        if(self.id === user.id) return respond(true);
        return respond(false);
      }
      respond(true);
    });
}, 'The specified email address is already in use.');

var validatePresenceOf = function(value) {
  return value && value.length;
};

/**
 * Pre-save hook
 */
UserSchema
  .pre('save', function(next) {
    if (!this.isNew) return next();

    if (!validatePresenceOf(this.local.hashedPassword) && authTypes.indexOf(this.provider) === -1)
      next(new Error('Invalid password'));
    else
      next();
  });

/**
 * Methods
 */
UserSchema.methods = {
  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */
  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.local.hashedPassword;
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */
  makeSalt: function() {
    return crypto.randomBytes(16).toString('base64');
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */
  encryptPassword: function(password) {
    if (!password || !this.local.salt) return '';
    var salt = new Buffer(this.local.salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
  }
};

module.exports = mongoose.model('User', UserSchema);
