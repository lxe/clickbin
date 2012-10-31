(function() {
  // var domain = 'clickb.in'
  var domain = 'testb.in'
  
  function loadScript(url, cb){
    var script = document.createElement("script");
    script.type = "text/javascript";
    if( script.readyState ){
      script.onreadystatechange = function(){
        if( script.readyState == "loaded" || script.readyState == "complete"){
          script.onreadystatechange = null;
          if(cb) cb();
        }
      };
    }else{
      if(cb){
        script.onload = cb;
      }
    }
    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
  }
  
  function appendStyle(href) {
    var el = document.createElement('link');
    el.rel = 'stylesheet';
    el.href = href;
    document.getElementsByTagName('head')[0].appendChild(el);
  }
  
  appendStyle('//' + domain + '/_/stylesheets/bootstrap-bookmarklet.css');
  
  loadScript('//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js',function(){
    
    /* MODAL CLASS DEFINITION
     * ====================== */

    var Modal = function(element, options) {
      this.options = options
      this.$element = $(element).delegate('[data-dismiss="modal"]', 'click.dismiss.modal', $.proxy(this.hide, this))
      this.options.remote && this.$element.find('.modal-body').load(this.options.remote)
    }
    Modal.prototype = {
      
      constructor: Modal
      , toggle: function() {
        return this[!this.isShown ? 'show' : 'hide']()
      }

      , show: function() {
        
        var that = this
          , e = $.Event('show')
        
        this.$element.trigger(e)
        
        if(this.isShown || e.isDefaultPrevented()) return
        
        this.isShown = true
        
        this.escape()
        
        this.backdrop(function() {
            var transition = $.support.transition && that.$element.hasClass('fade')

            if(!that.$element.parent().length) {
              that.$element.appendTo(document.body) //don't move modals dom position
            }

            that.$element.show()

            if(transition) {
              that.$element[0].offsetWidth // force reflow
            }

            that.$element.addClass('in').attr('aria-hidden', false)

            that.enforceFocus()

            transition ? that.$element.one($.support.transition.end, function() {
              that.$element.focus().trigger('shown')
            }) : that.$element.focus().trigger('shown')

          })
      }

      , hide: function(e) {
        e && e.preventDefault()
        
        var that = this
        
        e = $.Event('hide')
        
        this.$element.trigger(e)
        
        if(!this.isShown || e.isDefaultPrevented()) return
        
        this.isShown = false
        
        this.escape()
        
        $(document).off('focusin.modal')
        
        this.$element.removeClass('in').attr('aria-hidden', true)
        
        $.support.transition && this.$element.hasClass('fade') ? this.hideWithTransition() : this.hideModal()
      }

      , enforceFocus: function() {
        var that = this
        $(document).on('focusin.modal', function(e) {
          if(that.$element[0] !== e.target && !that.$element.has(e.target).length) {
            that.$element.focus()
          }
        })
      }

      , escape: function() {
        var that = this
        if(this.isShown && this.options.keyboard) {
          this.$element.on('keyup.dismiss.modal', function(e) {
            e.which == 27 && that.hide()
          })
        } else if(!this.isShown) {
          this.$element.off('keyup.dismiss.modal')
        }
      }

      , hideWithTransition: function() {
        var that = this
        , timeout = setTimeout(function() {
          that.$element.off($.support.transition.end)
          that.hideModal()
        }, 500)
        
        this.$element.one($.support.transition.end, function() {
          clearTimeout(timeout)
          that.hideModal()
        })
      }

      , hideModal: function(that) {
        this.$element.hide().trigger('hidden')
        this.backdrop()
      }

      , removeBackdrop: function() {
        this.$backdrop.remove()
        this.$backdrop = null
      }

      , backdrop: function(callback) {
        var that = this
          , animate = this.$element.hasClass('fade') ? 'fade' : ''
        
        if(this.isShown && this.options.backdrop) {
          var doAnimate = $.support.transition && animate
          
          this.$backdrop = $('<div class="clickbin-namespace-modal-backdrop ' + animate + '" />').appendTo(document.body)
          
          this.$backdrop.click(
          this.options.backdrop == 'static' ? $.proxy(this.$element[0].focus, this.$element[0]) : $.proxy(this.hide, this))
          
          if(doAnimate) this.$backdrop[0].offsetWidth // force reflow
          this.$backdrop.addClass('in')
          
          doAnimate ? this.$backdrop.one($.support.transition.end, callback) : callback()
        
        } else if(!this.isShown && this.$backdrop) {
          this.$backdrop.removeClass('in')
          $.support.transition && this.$element.hasClass('fade') ? this.$backdrop.one($.support.transition.end, $.proxy(this.removeBackdrop, this)) : this.removeBackdrop()
        } else if(callback) {
          callback()
        }
      }
    } // end Model
    
    
    /* MODAL PLUGIN DEFINITION
    * ======================= */
    $.fn.modal = function(option) {
      return this.each(function() {
        var $this = $(this)
        , data = $this.data('modal'),
        options = $.extend({}, $.fn.modal.defaults, $this.data(), typeof option == 'object' && option)
        if(!data) $this.data('modal', (data = new Modal(this, options)))
        if(typeof option == 'string') data[option]()
        else if(options.show) data.show()
      })
    }
    
    $.fn.modal.defaults = {
      backdrop: true
      , keyboard: true
      , show: true
    }
    
    $.fn.modal.Constructor = Modal
    
    
    /* MODAL DATA-API
    * ============== */
    $(document).on('click.modal.data-api', '[data-toggle="modal"]', function(e) {
      var $this = $(this)
      , href = $this.attr('href')
      , $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) //strip for ie7
      , option = $target.data('modal') ? 'toggle' : $.extend(
        {
          remote: !/#/.test(href) && href
        }
        , $target.data()
        , $this.data()
      )
      e.preventDefault()
      $target.modal(option).one('hide', function() {
        $this.focus()
      })
    })
    
    var url = '//' + domain + '/_/link/add.jsonp' + "?callback=?"
    $.getJSON( url, {foo:'bar'}, function(data){
      console.log('data: ')
      console.log(data)
      return
      var popup = document.createElement('div');
      popup.className = 'clickbin-namespace';

      html = ''
        += '<div class="modal" data-show="true" data-backdrop="true" id="bookmark-status">'
        += '  <div class="modal-header">'
        += '    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>'
        += '    <h3>Placed in a bin!</h3>'
        += '  </div>'
        += '  <div class="modal-body">'
        += '    <p>This page has been added to <a href="http://' + domain + data.path + '" target="_blank"><strong>' + domain + data.path + '</strong></a>. All further bookmarks will be added here. Change your default bin path at <a href="http://' + domain + '/">' + domain + '</a></p>'
        += '  </div>'
        += '  <div class="modal-footer">'
        += '    <a href="#" class="btn" data-dismiss="modal">OK</a>'
        += '  </div>'
        += '</div>'

      popup.innerHTML = html;
      document.getElementsByTagName('body')[0].appendChild(popup);

      window.jQuery('#bookmark-status').modal({
        show: true
      });
    })
  }) // jquery loaded
})();