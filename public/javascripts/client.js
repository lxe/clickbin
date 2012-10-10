$(function(){
  $(".ellipsis").ellipsis();
  window.onresize = function(){
    $(".ellipsis").ellipsis();
  }
})