/**
 * Scraper module - scrapes icons from web pages
 */
// TODO: in the event the <title> is available, pull the first <h1> tag
// TODO: check for a /favicon.ico if found then download, parse, resize it
var fs        = require('fs')
  , request   = require('request')
  , jsdom     = require("jsdom")
  , mkdirp    = require('mkdirp')
  , uuid      = require('node-uuid')
  , config    = require('../config')
  , Canvas      = require('canvas')
  , thumb = require('../controllers/thumb')(Canvas)
  , image_dir = __dirname + '/../public/_/images/thumbs'

// make sure the image directories exists
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
    var aborted = false
    var req = request.get({
      url : url 
      , headers : {
        'User-Agent' : config.userAgent
      }
    }).on('response', function(res) {
      if(res.statusCode !== 200) return fail()
      //console.log('statusCode: '+res.statusCode)
      
      var mime = res.headers['content-type'].split(';')[0]
        , image_type = imageType(mime)
        , html_type = htmlType(mime)
      
      // content is too long to process.
      // remember, the `content-length` header is not always required
      // ie., with Transfer-Encoding: chunked
      var size = res.headers['content-length']
      if(size){
        size = Number(size)
        if( size > config.maxRequestSize )
          return fail(new Error("thumbnail image size is larger then max size"))
      }
      
      // unsupported mime type
      if(!image_type && !html_type) return cb(null,{url:url,mime:mime})
      
      var data = []
      var dataLength = 0
      res.on('data',function(chunk){
        if(aborted) return
        data.push(chunk)
        dataLength += chunk.length
        if(dataLength > config.maxRequestSize) 
          // response to large!
          return fail(new Error("content size is larger then max size"))
      })
      res.on('end',function(){
        if(aborted) return
        
        var body = new Buffer(dataLength)
        // join all the chunks
        for (var i = 0, pos = 0; i < data.length; i++) { 
          data[i].copy(body, pos) 
          pos += data[i].length 
        }
        
        if(image_type){
          var name = uuid.v4() + '.' + image_type
          return saveThumbnails(body, name, mime, url, cb)
        }else if(html_type){
          //console.log('html type...')
          //console.log(body.toString('utf8'))
          //console.log('no body?')
          jsdom.env({
            html : body.toString('utf8')
          }, [
            // TODO: stop using google cdn
            'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js'
          ], function(err, window) {
            if (err) return fail(err)
            //console.log('getting page title: '+ window.$('title').text())
            // TODO: parse ico file and/or get <link rel="icon"> file
            // via: window.$('link[rel="icon"]').attr('href')
            return cb(null, {
              title : window.$('title').text()
              , url   : url
              , mime : mime
            })
          })
        }else fail(new Error("unsupported type: "+res.headers['content-type']))
      })
      res.on('error',function(err){
        return fail(err)
      })
    // TODO: double check this actually gets fired on error...
    }).on('error',cb)
    
    
    // failed to get additional meta data other then the url provided
    function fail(err){
      aborted = true
      if(err){
        console.error('error getting body for url: '+url)
        console.error(err)
        console.trace()
      }
      // end the request so we're not needlessly waiting for data we dont care about
      req.end()
      return cb(null,{url:url})
    }
    
    
    function saveThumbnails(image,name,mime,url,cb){
      thumb(image, 300, 300, function(err, canvas_300) {
        if(err) return fail(err)
        var buf_300 = canvas_300.toBuffer()
        if(err) return fail(err)
        fs.writeFile(image_dir + '/x300/' + name, buf_300, function(err){
          if(err) return fail(err)
          thumb(buf_300, 100, 100, function(err,canvas_100){
            if(err) return fail(err)
            var buf_100 = canvas_100.toBuffer()
            fs.writeFile(image_dir + '/x100/' + name, buf_100, function(err){
              if(err) return fail(err)
              delete buf_100 // dont need it anymore
              // we want to use the 300x300 image to scale to 64
              thumb(buf_300, 64, 64, function(err,canvas_64){
                if(err) return fail(err)
                var buf_64 = canvas_64.toBuffer()
                fs.writeFile(image_dir + '/x64/' + name, buf_64, function(err){
                  if(err) return fail(err)
                  delete buf_300
                  delete buf_64
                  return cb(null,{
                    url : url
                    , icon : '/_/images/thumbs/x64/' + name
                    , mime : mime
                  })
                })
              })
            })
          })
        })
      })
    }
    
    
  }
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

function htmlType(type){
  if(type) type = type.toLowerCase()
  else return null
  
  if(type.indexOf('html')!==-1) type = 'html'
  else type = null
  
  return type
}