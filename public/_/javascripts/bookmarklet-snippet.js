function appendScript(src) {
  var el = document.createElement('script');
  el.src = src;
  document.getElementsByTagName('head')[0].appendChild(el);
}

appendScript('//clickb.in/_/javascripts/bookmarklet.js' + location.href);
appendScript('//jsonp.clickb.in/' + location.href);