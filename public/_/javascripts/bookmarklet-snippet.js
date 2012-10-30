var loadedResources = [];
function appendScript(src) {
  var el = document.createElement('script');
  el.src = src;
  document.getElementsByTagName('head')[0].appendChild(el);
  el.onload = function() {
    loadedResources.push(el);
    if (loadedResources.length === 2) {
      appendScript('//jsonp.clickb.in/' + location.href);
    }
  }
}

appendScript('//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js');
appendScript('//clickb.in/_/javascripts/bookmarklet.js');
