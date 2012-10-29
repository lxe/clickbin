$(function() {
  //$(".ellipsis").ellipsis()

  window.onresize = function() {
    $(".ellipsis").ellipsis()
  }

  var newItemForm = $('#new-item-form')
  if (newItemForm) {
    var newItemTitle = $('#new-item-title')

    newItemForm.submit(function(event) {
      event.preventDefault()
      var item = newItemTitle.val()
      if (item !== '') {
        // if( path === '/' || path === '' ) window.location.href = '/' + item
        // else window.location = window.location.host + path.join('/') + '/' + item
        var host = window.location.host
        if(host.substr(-1) === '/') host = host.substring(0,-1)
        var path = window.location.pathname
        var parts = window.location.pathname.split('/')
        console.log('path: ' + path)
        var location = null
        if( path !=='/' && path !== '' ) 
          location = host + parts.join('/') + '/' + item
        else 
          location = host + '/' + item
        console.log('location: ' + location)
        window.location.href = window.location.protocol + '//' + location
        return false
      }
      return false
    })

  }

  $('#newsletter').submit(function() {
    $('#newsletter-thanks').modal()
    return true
  })

  $('[rel=tooltip]').tooltip()
  
  $('a.btn.public').tooltip({
    title : 'others can view this bin at ' + window.location.href
  })
})