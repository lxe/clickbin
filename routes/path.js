/**
 * Link/bin routing
 */
var _        = require('underscore')
  , crypto   = require('crypto')
  , user = require('./user')
  , pathCommandParser = require('../middleware/path-command-parser')

/**
 * [exports description]
 * @param  {[type]} app [description]
 * @return {[type]}     [description]
 */
module.exports = function (app) {
  
  app.get('/*', pathCommandParser, function (req, res, next) {
    var command = req.parsedPathCommand
    // TODO: put this inside an error handler middleware
    // if(opts instanceof Error){
    //   req.session.flash.error = opts.message
    //   return res.redirect('/')
    // }
    
    // the user 'route' but it's a little different then a regular route 
    // because it's actually just a subdomain. that's why the code looks
    // a little gross compared to the other routes.
    if(command.username) return user(req,res,next,command)
    
    // else, the user is anonymous...
    // TODO: all of this code needs to be put in a controller
    
    return res.send('Not Implemented')
    
  }) // end GET /path/[link]
  
}



function errorTopLevelBin(req, res){
  req.session.flash.error = "Sorry. We couldn not find the clickbin you requested."
  return res.redirect('/')
}

function errorNotRootBinOwner(req, res){
  req.session.flash.error = "Sorry. You cannot access the clickbin you requested."
  return res.redirect('/')
}

function errorMaxBinPath(req, res){
  // make sure bins dont get crazy...
  req.session.flash.error = "Too many levels of bins!"
    + "paths."
  return res.redirect('back')
}

function errorNameBin(req, res){
  req.session.flash.error = "You must <a href=\"/_/login\">register or sign "
    + "in</a> to name your bins. "
  return res.redirect('back')
}