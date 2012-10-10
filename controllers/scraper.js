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
  , image_dir = __dirname + '/../public/_/thumbs'

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
    var req = request.get(url).on('response', function(res) {
      if(res.statusCode !== 200)
        return fail()
      var size = Number(res.headers['content-length'])
      if( size > config.maxImageSize )
        return fail(new Error("thumbnail image size is large then max size"))
      var image_type = imageType(res)
      var html_type = htmlType(res)
      if(image_type || html_type){
        var body = new Buffer(size)
        var offset = 0
        res.on('data',function(chunk){
          chunk.copy(body,offset) // returns number of bytes written
          offset += chunk.length
        })
        res.on('end',function(){
          if(image_type){
            var name = uuid.v4() + '.' + image_type
            saveThumbnails(body,name,cb)
          }else if(html_type){
            jsdom.env({
              html : body.toString('utf8')
            }, [
              // TODO: stop using google cdn
              'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js'
            ], function(err, window) {
              if (err) return fail(err)
              return cb(null, {
                  icon  : window.$('link[rel="icon"]').attr('href')
                , title : window.$('title').text()
                , url   : url
              })
            })
          }else fail(new Error("unsupported type: "+res.headers['content-type']))
        })
        res.on('error',function(err){
          return fail(err)
        })
      // unsupported MIME type
      }else fail(new Error("unsupported MIME type"))
    })
    // failed to get additional meta data other then the url provided
    function fail(err){
      if(err){
        console.error('error getting body for url: '+url)
        console.error(err)
      }
      req.end()
      cb(null,{url:url})
    }
    
    function saveThumbnails(image,name,cb){
      thumb(image, 300, 300, function(err, canvas_300) {
        if(err) throw err;
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
                    , icon : '/_/thumbs/x64/' + name
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


function imageType(res) {
  var type = res.headers['content-type']
  if(type) type = type.toLowerCase()
  else return null
  
  if(type.indexOf('png')!==-1) type = 'png'
  else if(type.indexOf('jpg')!==-1) type = 'jpg'
  else if(type.indexOf('jpeg')!==-1) type = 'jpg'
  else if(type.indexOf('gif')!==-1) type = 'gif'
  else type = null
  
  return type
}

function htmlType(res){
  var type = res.headers['content-type']
  if(type) type = type.toLowerCase()
  else return null
  
  if(type.indexOf('html')!==-1) type = 'html'
  else type = null
  
  return type
}