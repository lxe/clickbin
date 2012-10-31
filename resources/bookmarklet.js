(function(){
  function loadScript(url, callback){
    var script = document.createElement("script");
    script.type = "text/javascript";
    if( script.readyState ){
      script.onreadystatechange = function(){
        if( script.readyState == "loaded" || script.readyState == "complete"){
          script.onreadystatechange = null;
          callback();
        }
      };
    }else script.onload = callback;
    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
  }
  loadScript("http://clickb.in/_/javascripts/bookmarklet.js?q=" + new Date )
})()