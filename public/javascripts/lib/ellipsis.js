
/**
  * originally taken from: http://stackoverflow.com/questions/536814/insert-ellipsis-into-html-tag-if-content-too-wide
  */
(function($) {
  $.fn.ellipsis = function()
  {
    return this.each(function()
    {
      var el = $(this);
      if(el.css("overflow") == "hidden")
      {
        if(!el.data('original-text')) el.data('original-text',el.html());
        var text = el.data('original-text');
        var t = '', split = 0
        el.html(text)
        if(el.width() > el.parent().width()){
          el.html('')
          for(var chars = 0; chars < text.length && el.width() < el.parent().width(); chars++){
            func(chars)
          }
          if(chars>2) func(chars-2)
        }
        function func(chars){
          split = Math.round(chars/2)
          console.log('chars; '+chars)
          console.log('split: '+split)
          console.log('chars-split: '+(chars-split))
          t = text.substring(0,split) + '...';
          if(chars > 1) t += text.substring(text.length - split,text.length)
          el.html(t);
        }
      }
    });
  };
})(jQuery);