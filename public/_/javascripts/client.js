$(function() {
  $(".ellipsis").ellipsis();

  window.onresize = function() {
    $(".ellipsis").ellipsis();
  }

  var newItemForm = $('#new-item-form');
  if (newItemForm) {
    var newItemTitle = $('#new-item-title');

    newItemForm.submit(function(event) {
      event.preventDefault();
      var item = newItemTitle.val();
      if (item !== '') {
        window.location.href += '/' + newItemTitle.val();
      }
      return false;
    });

  }

  $('#newsletter').submit(function() {
    $('#newsletter-thanks').modal();
    return true;
  });
})