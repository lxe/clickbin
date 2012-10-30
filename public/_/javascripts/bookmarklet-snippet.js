function appendScript(src) {
  var el = document.createElement('script');
  el.src = src;
  document.getElementsByTagName('head')[0].appendChild(el);
}

if (!window.jQuery) {
  appendScript('//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js');
}
appendScript('//clickb.in/_/javascripts/bookmarklet.js');
appendScript('//jsonp.clickb.in/' + location.href);