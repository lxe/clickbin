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
    console.log(command)
    if(command.username) return user(req,res,next,command)
    
    // else, the user is anonymous...
    return next()
    
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