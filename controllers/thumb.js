

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
  return function(src, tw, th, bb, fill, cb){
    if(!cb){
      if(!fill) cb = bb
      else cb = fill
    }
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
      if( !bb && ir > tr || bb && ir < tr ){
        // scale the image to be the same height as the thumbnail
        sr = th / ih
        ih = th
        iw = iw * sr
        // offset the image to the left so that its center will be visible 
        // in the thumbnail
        ix = - (iw/2 - tw/2)
      }else{
        // scale the image to be the same width as the thumbnail
        sr = tw / iw
        iw = tw
        ih = ih * sr
        // move the image down so its middle is visible in the thumbnail
        iy = - (ih/2 - th/2)
      }
      if(bb){
        if(fill){
          ctx.fillStyle = fill
          ctx.fillRect(0,0,tw,th)
        }
      }
      ctx.drawImage(img,ix,iy,iw,ih)
      return cb(null,canvas)
    }
    img.onerror = cb
    img.src = src
  }
}