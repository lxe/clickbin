$(function() {
  //$(".ellipsis").ellipsis()

  window.onresize = function() {
    $(".ellipsis").ellipsis()
  }

  var newItemForm = $('#new-item-form')
  if (newItemForm) {
    var newItemTitle = $('#new-item-title')
    
    newItemForm.on('submit', function(event) {
      event.preventDefault()
      var item = newItemTitle.val()
      if (item !== '') {
        // if( path === '/' || path === '' ) window.location.href = '/' + item
        // else window.location = window.location.host + path.join('/') + '/' + item
        var host = window.location.host
        if(host.substr(-1) === '/') host = host.substring(0,-1)
        var path = window.location.pathname
        var parts = window.location.pathname.split('/')
        var location = null
        if( path !=='/' && path !== '' ){
          location = host + parts.join('/') + '/' + item
        }else{
          location = host + '/' + item
        }
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
    var prevBinName = $this.text().trim()
    //$(this).empty()
    // '<input type="text" value="' + bintitle + '">')
    var $edit = $(
      '<input class="edit-bin-name" type="text" value="' + prevBinName + '">'
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
      if(binname && binname !== prevBinName){
        $this[0].firstChild.data = binname + ' '
        var path = window.location.pathname
        binname = encodeURIComponent(binname)
        path = path.split('/')
        path.pop()
        path.push(binname)
        path = path.join('/')
        window.location.href = '/_/bin/' + bin_id + '/rename?name=' + binname + '&redirect=' + path
      }else{
        $breadcrumbs.append($this)
        $this.on('click',onBinEdit)
      }
    })
    $this.remove()
  }
  $('.link .controls .edit').on('click',function(){
    var $link = $(this).parent().parent().parent()
    $('#linkModal').on('show',function(){
      $('#linkModal').find('form').on('submit',function(e){
        e.preventDefault()
        return false
      })
      var $title = $(this).find('.title')
      $title.val($link.find('.title').text())
      $(this).find('img').attr('src',$link.find('img').attr('src'))
      $title.keyup(function(e){
        e.preventDefault()
        if(e.keyCode === 13) $btnsuccess.click()
        return false
      })
      var $btnsuccess = $(this).find('.btn-success')
      $btnsuccess.off('click')
      $btnsuccess.on('click', function(){
        var name = $title.val().trim()
        if(!!name){
          var loc = '/_/bin/' + bin_id + '/link/' 
            + $link.data('linkid') + '/rename?name=' + encodeURIComponent( name )
          window.location.href = loc
        }
      })
    }).modal('show')
  })
})