var fs = require('fs');
var jParser = require('jparser');
var _ = require('underscore');
var Canvas = require('canvas');

fs.readFile('../public/images/favicon.ico', function (err, buffer) {
  var parser = new jParser(buffer, {
    uint4: function () {
      // By default, we can only parse 8 bits at a time.
      // When uint4 is called, it will parse 8 bits,
      // return the first 4 and cache the 4 others for
      // the next call.
      if (this.hasUint4Buffer) {
        this.hasUint4Buffer = false;
        return this.uint4Buffer;
      } else {
        this.hasUint4Buffer = true;
        var uint8 = this.parse('uint8');
        this.uint4Buffer = uint8 >>> 4;
        return uint8 & 0x0f;
      }
    },

    rgba: {
      r: 'uint8',
      g: 'uint8',
      b: 'uint8',
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
        var that = this;
        return that.seek(that.current.offset, function () {
          return that.parse({
            palette: ['array', 'rgba', that.current.paletteCount],
            pixels: [
              'array',
              ['array', 'uint' + that.current.bitsPerPixel, that.current.width],
              that.current.height
            ]
          });
        });
      }
    },

    file: {
      header: 'header',
      images: ['array', 'image', function () { return this.current.header.imageCount; }]
    }
  });
  
  var ico = parser.parse('file');
  
  var canvas = new Canvas(ico.images[0].width,ico.images[0].height)
    , ctx = canvas.getContext('2d')
    , img = ctx.createImageData(canvas.width,canvas.height)
  
  var i = 0
  _.each(ico.images[0].content.pixels,function(col){
    _.each(col,function(row){
      console.log('row: '+row)
      var pixel = row.toString(16)
      console.log('pixel: '+pixel)
      img.data[i++] = parseInt( pixel.substr(2,2), 16)
      console.log(img.data[i-1])
      img.data[i++] = parseInt( pixel.substr(4,2), 16)
      console.log(img.data[i-1])
      img.data[i++] = parseInt( pixel.substr(6,2), 16)
      console.log(img.data[i-1])
      img.data[i++] = parseInt( pixel.substr(0,2), 16)
      console.log(img.data[i-1])
    })
  })
  ctx.putImageData(img, 0, 0); // at coords 0,0
  var out = fs.createWriteStream(__dirname + '/test.png')
   , stream = canvas.createPNGStream().pipe(out)
  //console.log(require('util').inspect(ico, false, 10));
});