var fs = require('fs')
  , jParser = require('jparser')
  , _ = require('underscore')
  , Canvas = require('canvas')
  , util = require('util')

// the spec: http://msdn.microsoft.com/en-us/library/ms997538.aspx
fs.readFile('favicon.ico', function (err, buffer) {
  var parser = new jParser(buffer, {
    
    header : {
      reserved: 'uint16'
      , type: 'uint16'
      , imageCount: 'uint16'
    }
    
    // an image entry in the directory of the ICO file
    , iconDirEntry : {
      bWidth : 'uint8'
      , bHeight : 'uint8'
      , bColorCount : 'uint8'
      , bReserved : 'uint8'
      , wPlanes : 'uint16'
      , wBitCount : 'uint16'
      , dwBytesInRes : 'uint32'
      , dwImageOffset : 'uint32'
    }
    
    , rgba: {
      b: 'uint8'
      , g: 'uint8'
      , r: 'uint8'
      , a: 'uint8'
    }
    // http://msdn.microsoft.com/en-us/library/windows/desktop/dd183376(v=vs.85).aspx
    , bitmapInfoHeader : {
      biSize : 'uint32'
      , width : 'uint32'
      , height : function(){
        return this.parse('uint32') / 2
      }
      // a lot of these fields arent used but theyre still there, in the binary
      , biPlanes : 'uint16'
      , biBitCount : 'uint16'
      , biCompression : 'uint32'
      , biSizeImage : 'uint32'
      , biXPelsPerMeter : 'uint32'
      , biYPelsPerMeter : 'uint32'
      , biClrUsed : 'uint32'
      , biClrImportant : 'uint32'
    }
    
    , images : function(){
      var self = this
      var res = []
      this.current.header.imageCount
      _.each(this.current.idEntries,function(entry){
        self.seek(entry.dwImageOffset)
        res.push(self.parse('iconImage'))
      })
      return res
    }
    , iconImage : {
      header : 'bitmapInfoHeader'
      , pixels : [ 'array' , 'rgba' , function(){ 
        // return this.current.icHeader.biSize 
        return this.current.header.width *  this.current.header.height
      }]
    }
    
    , file: {
      header: 'header'
      , idEntries : ['array','iconDirEntry', function(){ return this.current.header.imageCount }]
      , images: 'images'
    }
  })
  
  var ico = parser.parse('file')
  // image = ico.images[0]
  _.each(ico.images,function(image,i){
    var out = fs.createWriteStream(__dirname + '/image-' + i + '.png')
    icoImageToPNGStream(image).pipe(out)
  })
})

function icoImageToPNGStream(image){
  var canvas = new Canvas(image.header.width,image.header.height)
  , ctx = canvas.getContext('2d')
  , img = ctx.createImageData(canvas.width,canvas.height)
  , ind = 0
  , row = canvas.height - 1
  , col = 0
  
  _.each(image.pixels, function(pixel){
    img.data[row*canvas.width*4 + col++] = pixel.r
    img.data[row*canvas.width*4 + col++] = pixel.g
    img.data[row*canvas.width*4 + col++] = pixel.b
    img.data[row*canvas.width*4 + col++] = pixel.a
    if( col >= canvas.width*4){
      col = 0
      row--
    }
  })
  ctx.putImageData(img, 0, 0) // at coords 0,0
  return canvas.createPNGStream()
}