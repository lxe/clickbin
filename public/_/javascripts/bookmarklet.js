function appendStyle(href) {
  var el = document.createElement('link');
  el.rel = 'stylesheet';
  el.href = href;
  document.getElementsByTagName('head')[0].appendChild(el);
}

function jsonp(data) {
  appendStyle('//clickb.in/_/stylesheets/bootstrap-bookmarklet.css');
  appendScript('//netdna.bootstrapcdn.com/twitter-bootstrap/2.1.1/js/bootstrap.min.js');

  var popup = document.createElement('div');
  popup.className = 'clickbin-namespace';

  html = '';
  html += '<div class="modal hide fade" id="bookmark-status">';
  html += '  <div class="modal-header">';
  html += '    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>';
  html += '    <h3>Placed in a bin!</h3>';
  html += '  </div>';
  html += '  <div class="modal-body">';
  html += '    <p>This page has been added to <a href="http://clickb.in' + data.path + '" target="_blank"><strong>clickb.in' + data.path + '</strong></a>. All further bookmarks will be added here. Change your default bin path at <a href="http://clickb.in/">clickb.in</a></p>';
  html += '  </div>';
  html += '  <div class="modal-footer">';
  html += '    <a href="#" class="btn" data-dismiss="modal">OK</a>';
  html += '  </div>';
  html += '</div>';

  popup.innerHTML = html;

  document.getElementsByTagName('body')[0].appendChild(popup);
  $('#bookmark-status').modal({
    show: true
  });
}