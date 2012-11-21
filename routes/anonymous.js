
/**
 * for processing requests for user subdomains.
 * ie., `username.clickb.in`
 */

var Link = require('../models/link')
  , User = require('../models/user')
  , config = require('../config')
  , mongoose = require('mongoose')
  , _ = require('underscore')


module.exports = function(req, res, next, opts) {
  // this route is called from the `path` route. the path route first parses out
  // the following parameters and gives it to us via the `opts` argument
  var path = opts.path
    , link = opts.link
    , tags = opts.tags
  
  return next(new Error("Sorry! We couldn't find what you were looking for."))
}