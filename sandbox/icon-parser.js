var fs = require('fs')
  , jParser = require('jparser')
  , _ = require('underscore')
  , Canvas = require('canvas')

fs.readFile('favicon.ico', function (err, buffer) {
  var parser = new jParser(buffer, {
    uint4: function () {
      // By default, we can only parse 8 bits at a time.
      // When uint4 is called, it will parse 8 bits,
      // return the first 4 and cache the 4 others for
      // the next call.
      if (this.hasUint4Buffer) {
        this.hasUint4Buffer = false
        return this.uint4Buffer
      } else {
        this.hasUint4Buffer = true
        var uint8 = this.parse('uint8')
        this.uint4Buffer = uint8 >>> 4
        return uint8 & 0x0f
      }
    },

    rgba: {
      b: 'uint8',
      g: 'uint8',
      r: 'uint8',
      a: 'uint8'
    },

    header: {
      reserved: 'uint8',
      type: 'uint8',
      imageCount: 'uint8',
      padding: ['array', 'uint8', 3]
    },

    image: {
      width: 'uint8',
      height: 'uint8',
      paletteCount: 'uint8',
      reserved: 'uint8',
      colorPlanes: 'uint16',
      bitsPerPixel: 'uint16',
      size: 'uint32',
      offset: 'uint32',
      content: function () {
        var that = this
        return that.seek(that.current.offset, function () {
          return that.parse({
            palette: ['array', 'rgba', that.current.paletteCount],
            pixels: ['array', 'rgba', that.current.width * that.current.height + that.current.offset]
          })
        })
      }
    },

    file: {
      header: 'header',
      images: ['array', 'image', function () { return this.current.header.imageCount }]
    }
  })
  
  var ico = parser.parse('file')
  
  // console.log('meta data: ')
  // console.log(ico.header)
  // console.log('paletteCount: '+ico.images[0].paletteCount)
  // console.log('colorPlanes: '+ico.images[0].colorPlanes)
  // console.log('bitsPerPixel: '+ico.images[0].bitsPerPixel)
  // console.log('size: '+ico.images[0].size)
  // console.log('offset: '+ico.images[0].offset)
  // console.log('palette: '+JSON.stringify(ico.images[0].content.palette))
  //process.exit()
  
  var canvas = new Canvas(ico.images[0].width,ico.images[0].height)
    , ctx = canvas.getContext('2d')
    , img = ctx.createImageData(canvas.width,canvas.height)
  
  var ind = 0, row = canvas.height-1, col = 0
  _.each(ico.images[0].content.pixels, function(pixel){
    if( ind++ < 10 ) return
    img.data[row*canvas.width*4 + col++] = pixel.r
    img.data[row*canvas.width*4 + col++] = pixel.g
    img.data[row*canvas.width*4 + col++] = pixel.b
    img.data[row*canvas.width*4 + col++] = pixel.a
    if( col >= canvas.width*4){
      col = 0
      row--
    }
    // for(var k = 0; k < 4; k++){
    //   img.data[j++] = parseInt( pixel.substr(0,2), 16)
    //   pixel = pixel.substr(2)
    // }
  })
  ctx.putImageData(img, 0, 0) // at coords 0,0
  var out = fs.createWriteStream(__dirname + '/test.png')
   , stream = canvas.createPNGStream().pipe(out)
  //console.log(require('util').inspect(ico, false, 10))
})