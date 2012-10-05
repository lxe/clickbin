var fs = require('fs')
  , fav = require('fav')
  , _ = require('underscore')
  , Canvas = require('canvas')

// the spec: http://msdn.microsoft.com/en-us/library/ms997538.aspx
fav('reddit.ico', function (err, ico) {
  if(err) throw err
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