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

  $('#new-item-title').tooltip({ 
    placement: 'bottom'
    , title: 'Name your bin or paste a web address'
    , trigger: 'manual'
  })

  $('.add-something').on('click', function(event) {
    event.preventDefault();
    $('#new-item-title').focus();
    $('#new-item-title').tooltip('show');
  })

  $('#new-item-title').on('blur', function(event) {
    $('#new-item-title').tooltip('hide');
  })
  
  $('.bin-link.active.editable').on('click',onBinEdit)
  function onBinEdit(){
    $this = $(this)
    var binname = $this.text().trim()
    //$(this).empty()
    // '<input type="text" value="' + bintitle + '">')
    var $edit = $(
      '<input class="edit-bin-name" type="text" value="' + binname + '">'
      + '</input>'
      + '<a class="btn edit-done"> done </a>'
    )
    var $breadcrumbs = $this.parent()
    $breadcrumbs.append($edit)
    $('.edit-bin-name').keyup(function(e){
      if(e.keyCode === 13) $('.edit-done').click()
    })
    $('.edit-done', $breadcrumbs).on('click', function(){
      var binname = $('.edit-bin-name', $breadcrumbs).val().trim()
      $edit.remove()
      if(binname){
        $this[0].firstChild.data = binname + ' '
        // $breadcrumbs.append($this)
        // $this.on('click',onBinEdit)
        var path = window.location.pathname
        binname = encodeURIComponent(binname)
        path = path.split('/')
        path.pop()
        path.push(binname)
        path = path.join('/')
        window.location.href = '/_/bin/' + bin_id + '/rename?name=' + binname + '&redirect=' + path
      }
    })
    $this.remove()
  }
})