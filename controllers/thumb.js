

module.exports = function(Canvas){
  if(!Canvas) throw new Error("No Canvas class provided")
  /**
    * @param src the source image
    * @param tw the width of the thumbnail
    * @param th the height of the thumbnail
    * @param bb should the image be scaled to fill the entire thumbnail? or 
    * scaled to the entier of the image with black bars? (defaults to true)
    * @param fill the fill color of the bb's
    * returns a canvas element as the second param of the callback
    */
  return function(src, tw, th, cb, opts){
    opts = opts || {}
    if(typeof opts.bb === 'undefined') opts.bb = true
    if(typeof opts.scaleUp === 'undefined') opts.scaleUp = false
    var img = new Canvas.Image
    img.onload = function(){
      var iw = img.width
        , ih = img.height
        , ix = 0
        , iy = 0
        , canvas = new Canvas(tw,th)
        , ctx = canvas.getContext('2d')
        , dw = 0
        , dh = 0
        , sr = 1
        , ir = iw / ih
        , tr = tw / th
    
      // if the original image aspect ratio is greater than the new thumbnail 
      // image ratio, scale the image using the height, if not, us the width
      // reverse this logic if bb is set to `true`
      if( !opts.bb && ir > tr || opts.bb && ir < tr ){
        // scale the image to be the same height as the thumbnail
        sr = th / ih
        if(sr < 1 || sr > 1 && opts.scaleUp){
          ih = th
          iw = iw * sr
        }
      }else{
        // scale the image to be the same width as the thumbnail
        sr = tw / iw
        if(sr < 1 || sr > 1 && opts.scaleUp){
          iw = tw
          ih = ih * sr
        }
      }
      // offset the image to the left so that its center will be visible 
      // in the thumbnail
      ix = - (iw / 2 - tw / 2)
      // move the image down so its middle is visible in the thumbnail
      iy = - (ih / 2 - th / 2)
      if(opts.bb){
        if(opts.fill){
          ctx.fillStyle = opts.fill
          ctx.fillRect(0, 0, tw, th)
        }
      }
      ctx.antialias = opts.antialias || 'subpixel'
      ctx.patternQuality = opts.patternQuality || 'nearest'
      ctx.drawImage(img, ix, iy, iw, ih)
      return cb(null,canvas)
    }
    img.onerror = cb
    img.src = src
  }
}