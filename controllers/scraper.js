/**
 * Scraper module - scrapes icons from web pages
 */
var fs                        = require('fs')
  , request                   = require('request')
  , cheerio                   = require("cheerio")
  , mkdirp                    = require('mkdirp')
  , uuid                      = require('node-uuid')
  , config                    = require('../config')
  , Canvas                    = require('canvas')
  , _                         = require('underscore')
  , thumb                     = require('../controllers/thumb')(Canvas)
  , image_rel_dir             = '/_/images/thumbs'
  , image_dir                 = __dirname + '/../public' + image_rel_dir
  , path                      = require('path')
  , node_url                  = require('url')
  , hostnameSpecificScrapers  = require('./hostname-specific-scrapers')

// make sure the image directories exists. (dirp.. dirp..)
mkdirp(image_dir, function(err) { if(err) throw err })
mkdirp(image_dir + '/x300',function(err) { if(err) throw err })
mkdirp(image_dir + '/x100',function(err) { if(err) throw err })
mkdirp(image_dir + '/x64',function(err) { if(err) throw err })

module.exports = {
  
  /**
   * Scrape a page, pulling metadata, like the title, desc, mime type and thumbnail
   * @param  {[type]}   url the url link to grab a thumbnail and description text for
   * @param  {Function} cb  the callback called when that happens. of the form (err,link)
   */
  get : function(url, cb) {
    
    var req = urlRequest(url)
    console.log('scrapping url: ' + url)
    makeLimitedRequest(req,{
      size : config.maxRequestSize
      , mime : [imageType,htmlType]
    }, function(err, mime, body){
      if(err) return fail(err,req,mime)
      // is the result an image?
      var ext = imageType(mime)
      if(ext){
        console.log('type image')
        var name = uuid.v4() + '.' + ext
        console.log('name: '+name)
        return saveThumbnails(body, name, function(err,icon){
          if(err) return fail(err,req,mime)
          else return cb(null,{
            url : url
            , mime : mime
            , icon : icon
          })
        })
      // is the result html?
      }else if(htmlType(mime)){
        var $ = cheerio.load(body.toString())
        
        var page = hostnameSpecificScrapers(url,$)
        
        // see if there's an icon we can use.
        if(!page.icon || page.__dont_scrape_icon){
          console.log('the page didnt seem to have a useable icon')
          return cb(null, {
            title : page.title
            , url   : url
            , desc : page.desc
            , icon : page.icon
            //incase there's no icon, we can also use the mime type to display an icon
            , mime : mime
          })
        }else{
          // get the icon
          var req = urlRequest(page.icon)
          makeLimitedRequest(req,{
            size : config.maxRequestSize
            , mime : [imageType]
          },function(err,mime,body) {
            if(err) return fail(err,req,mime)
            var name = uuid.v4() + '.' + imageType(mime)
            console.log('saving thumbs: '+name)
            saveThumbnails(body, name, function(err, icon) {
              if(err) return fail(err, req, mime)
              else return cb(null,{
                url : url
                , title : page.title
                , desc : page.desc
                , mime : mime
                , icon : icon
              })
            })
          })
        }
      }else return fail(new Error("unsupported type: " + mime),req)
    })
    // failed to get additional meta data (other then the url provided)
    function fail(err,req,mime) {
      if(err){
        console.error('error getting body for url: '+url)
        console.error(err)
        console.trace()
      }
      // abort the request so we're not needlessly waiting for data we dont care about
      req.abort()
      return cb(null,{
        url : url
        , mime : mime
      })
    }
  }
}

function makeLimitedRequest(req,limits,cb) {
  req.on('response', function(res){
    if(res.statusCode!==200) return cb(new Error("Invalid Status Code: "+res.statusCode))
    
    var mime = getMime(res)
    
    // check if the content is too long to process.
    // remember, the `content-length` header is not always required
    // ie., with Transfer-Encoding: chunked
    // we just do this to make sure people dont try and get us to download 
    // massive files.
    var size = getSize(res)
    if(size){
      size = Number(size)
      if( limits.size && limits.size > config.maxRequestSize )
        return cb(new Error("request size is larger then max size"))
    }
    
    // unsupported mime type
    var type = null
    
    // kill the request if it doesnt have a particular mime type
    // TODO: it would be better if we just used the `Accept` header
    if(limits.mime){
      _.any(limits.mime,function(typeCheck){
        return type = typeCheck(mime)
      })
      // these aren't the types you're looking for...
      if(!type) return cb(new Error("Type not found"),mime)
    }
    
    var data = []
    var dataLength = 0
    res.on('data',function(chunk){
      data.push(chunk)
      dataLength += chunk.length
      if(limits.size && dataLength > limits.size )
        // response to large!
        return cb(new Error("content size is larger then max size"),mime)
    })
    res.on('end',function(){
      var body = new Buffer(dataLength)
      // join all the chunks
      for (var i = 0, pos = 0; i < data.length; i++) { 
        data[i].copy(body, pos) 
        pos += data[i].length 
      }
      return cb(null, mime, body)
    })
  }).on('error',cb)
  return req
}



function urlRequest(url) {
  return request.get({
    url : url
    , headers : {
      // we use a mock user agent string to `trick` sites like facebook into 
      // serving our request properly
      'User-Agent' : config.userAgent
    }
  })
}

function imageType(type) {
  if(type) type = type.toLowerCase()
  else return null
  
  if(type.indexOf('png')!==-1) type = 'png'
  else if(type.indexOf('jpg')!==-1) type = 'jpg'
  else if(type.indexOf('jpeg')!==-1) type = 'jpg'
  else if(type.indexOf('gif')!==-1) type = 'gif'
  else type = null
  
  return type
}

function htmlType(type) {
  if(type) type = type.toLowerCase()
  else return null
  
  if(type.indexOf('html')!==-1) type = 'html'
  else type = null
  
  return type
}

function getMime(res) {
  return res.headers['content-type'].split(';')[0]
}

function getSize(res) {
  return res.headers['content-length']
}

function saveThumbnails(image,name,cb) {
  thumb(image, 300, 300, function(err, canvas_300) {
    if(err) console.error('unable to produce the first thumbnail for the provided '
        + 'image. this likely indicates that not all of node-canvas\'s '
        + 'depencies were installed.')
    if(err) return cb(err)
    var buf_300 = canvas_300.toBuffer()
    if(err) return cb(err)
    fs.writeFile(image_dir + '/x300/' + name, buf_300, function(err) {
      if(err) return cb(err)
      thumb(buf_300, 100, 100, function(err, canvas_100){
        if(err) return cb(err)
        var buf_100 = canvas_100.toBuffer()
        fs.writeFile(image_dir + '/x100/' + name, buf_100, function(err) {
          if(err) return cb(err)
          delete buf_100 // dont need it anymore
          // we want to use the 300x300 image to scale to 64
          thumb(buf_300, 64, 64, function(err, canvas_64){
            if(err) return cb(err)
            var buf_64 = canvas_64.toBuffer()
            fs.writeFile(image_dir + '/x64/' + name, buf_64, function(err) {
              if(err) return cb(err)
              delete buf_300
              delete buf_64
              return cb(null, image_rel_dir + '/x64/' + name)
            })
          })
        })
      })
    })
  })
}