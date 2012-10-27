/**
 *  Common utilities
 */

var crypto = require('crypto')
  , _ = require('underscore')
  , config = require('../config')

var common = module.exports = {
  
  /**
   * [md5 description]
   * @param  {[type]} orginal_str [description]
   * @return {[type]}             [description]
   */
  md5: function(orginal_str) {
    return crypto.createHash('md5').update(orginal_str).digest("hex")
  }

  /**
   * [digest description]
   * @param  {[type]} password [description]
   * @param  {[type]} salt     [description]
   * @return {[type]}          [description]
   */
  , digest: function(password, salt) {
    salt = salt || crypto.randomBytes(23).toString('base64')
    var digest = common.sha2(password + salt)

    // apply stretching
    for (var i = 0; i < 4; i++) digest = common.sha2(digest)
    return { salt: salt, digest: digest }
  }

  /**
   * [sha2 description]
   * @param  {[type]} password [description]
   * @return {[type]}          [description]
   */
  , sha2: function(password) {
    return crypto.createHash('sha512').update(password).digest('hex')
  }

  /**
   * [sha1 description]
   * @param  {[type]} msg [description]
   * @param  {[type]} key [description]
   * @return {[type]}     [description]
   */
  , sha1: function(msg, key) {
    return crypto.createHmac('sha256', key).update(msg).digest('hex')
  }


  /**
   * [validateRegex description]
   * @param  {[type]} val   [description]
   * @param  {[type]} regex [description]
   * @return {[type]}       [description]
   */
  , validateRegex: function(val, regex) {
    return val ? regex.test(val) : false;
  }

  /**
   * [validateEmail description]
   * @param  {[type]} email [description]
   * @return {[type]}       [description]
   */
  , validateEmail: function(email) {
    if(email) return common.validateRegex(email,
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,6}$/)
    else return true // a user can optionally not have an email
  }

  /**
   * [validateUsername description]
   * @param  {[type]} username [description]
   * @return {[type]}          [description]
   */
  , validateUsername: function(username) {
    if(_.any(config.reservedUsernames,function(name){
      return username === name
    })) return false
    var valid = common.validateRegex(username,config.usernameRegex)
    console.log('validateUsername: ' + valid)
    return valid
  }

  /**
   * [validatePassword description]
   * @param  {[type]} password [description]
   * @return {[type]}          [description]
   */
  , validatePassword: function(password) {
    return (password && password.length >= 6 
      && /^[^ \t\r\n]*$/.test(password))
  }
}