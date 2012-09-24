/**
 * Link/bin routing
 */

var url    = require('url')
  , _      = require('underscore')
  , crypto = require('crypto')
  , uuid   = require('node-uuid')
  , Bin    = require('../models/bin')
  , Link   = require('../models/link')

/**
 * [exports description]
 * @param  {[type]} app [description]
 * @return {[type]}     [description]
 */
module.exports = function(app) {

  /**
   * [uri_regexp description]
   * @type {RegExp}
   */
  var uri_regexp = /^\/((?:[^\/]+\/?)+?)(\w+?:\/\/)?([^\/]+\..+)?$/;


  /**
   * [ description]
   * @param  {[type]}   req  [description]
   * @param  {[type]}   res  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  app.get(uri_regexp, function(req, res, next) {
    function linkError(errStr) {
      req.session.flash.linkError = errStr;
      return res.redirect('/');
    }

    var matches = uri_regexp.exec(req.url);
    if (!matches || matches.length === 0)
      return linkError('Invalid URL');

    var protocol = matches[matches.length - 2] || 'http://'
      , uri      = matches[matches.length - 1]
      , path     = matches[1]

    protocol = protocol.split(':')[0];
    if (!/ftp|http|https|mailto|file/.test(protocol)) 
       return linkError('Invalid Protocol');

    function callback() {
      return res.render('bin', {
        path: matches[1],
        bin: bin
      });
    }

    Bin.find({ name: path }, function(err, bin) {

      // No exisitng bin found
      if (err) {

        // Only handle anonymous public bins
        // TODO: Add user bin support
        if (!path) {
          bin      = new Bin();

          // TODO: Use the counter instead of this :)
          bin.path = uuid.v4();
        } else {

          // TODO: Add user bin support
          return linkError('Custom bins not implemented. Yet...');
        }
      }

      bin.save(function(err) {
        if (err) return linkError('Crazy server error');

        Link.find({ uri: protocol + '://' + uri }, function(err, link) {

          // No existing link found
          if (err) {
            link     = new Link();
            link.uri = protocol + '://' + uri;
            link.save(function(err) {
              if (err) return linkError('Crazy server error');
              bin.links.push(link);
              return callback();
            });
          }

          // Found existing link
          bin.links.push(link);
          return callback();
        });        
      });
    });
  });

}
