/**
  * for processing requests for user subdomains.
  * ie., `username.clickb.in`
  */

var Bin = require('../models/bin')
  , Link = require('../models/link')


module.exports = function(req,res,next,opts){
  // this route is called from the `path` route. the path route first parses out
  // the following parameters and gives it to us via the `opts` object above
  var username = opts.username
    , path = opts.path
    , uri = opts.uri
    , protocol = opts.protocol
    , bins = (path)?path.substr(1).split('/'):null
  if(path===undefined) path = '/'
  if(path==='/' && !uri){
    // show the user `root` bin. aka, their profile page
    Bin.findUserBin(username,function(err,bin){
      if(err) return next(err)
      if(!bin) return res.render('errors/404',{
        error : {
          title : 'User Not Found'
          , msg : 'No user exists with that name'
        }
      })
      bin.getChildren(function(err,children){
        if(err) return next(err)
        else return res.render('user',{
          profile : {
            username : username
          }
          , bin : bin
          , children : children
        })
      })
    })
  }else if(!uri){
    // create/show a bin
    Bin.findUserBin(username,path,function(err,bin){
      if(err) return next(err)
      if(!bin){
        if(req.session.user && req.session.user.username === username){
          var bin = new Bin({
            path : username + ':' + path
          })
          bin.save(function(err){
            ensureBinsExistAlongPath(username,bins)
            if(err) return next(err)
            return render(bin)
          })
        }else{
          if(!bin) return res.render('errors/404',{
            error : {
              title : 'Bin Not Found'
              , msg : username + ' doesn\'t have a bin with that name.'
            }
          })
        }
      }else // show the bin
        return render(bin)
    })
  }else if(uri){
    // add a link to a users bin
    Bin.findUserBin(username, path, function (err, bin) {
      if(err) return next(err)
      // check permissions
      if ( !req.session.user || req.session.user.username !== username ) {
        // access denied
        req.session.flash.error = 'You can\'t add links to bins you don\'t own.'
        return res.redirect(path)
      }
      else{
        // access granted
        if(!bin){
          // we need to create the bin
          Link.scrape(uri,function(err,link){
            if(err) return next(err)
            var bin = new Bin({
              path : username + ':' + path
              // since the bin deosnt exist yet, this has got to be the first link
              , links : [link]
            })
            bin.save(function(err){
              if(err) return next(err)
              else return render(bin)
            })
          })
        }else{
          // the bin already exists, so add the link to it
          return addLinkToUserBin(path,protocol,uri,bin)
        }
      }
    })
  }
  
  // show the user bin page
  function render(bin) {
    // meanhile, in russia
    bin.getChildren(function(err,children){
      if(err) return next(err)
      return res.render('user', {
        path: path
        , title : username
        , bin: bin
        , children : children
        , profile : {
          username : username
        }
      })
    })
  }
  
  // add the link to a user bin
  
  function addLinkToUserBin(path, protocol, uri, bin) {
    Link.scrape(protocol + uri, function (err, link) {
      if (err) return cb(err)
      if (bin.addLink(link)) return bin.save(function(err) {
        if(err) return next(err)
        return res.redirect(path)
      })
      else{
        // the link already exists
        req.session.flash.error = 'This bin already has that link'
        return res.redirect(path)
      }
    })
  }
}


function ensureBinsExistAlongPath(username,bins){
  for(var i = bins.length; i > 0; i--){
    // go create the bins, if they dont exist yet
    var path = username + ':/' + bins.slice(0,i).join('/')
    Bin.collection.findAndModify(
      { path : path }   // query
      , []                              // sort
      , {                               // update
        $set : { path : path }
      }
      , { upsert : true }               // options
    // we dont need to wait for this callback. fire and forget
    , function(){})
  }
}