$(document).ready(function() {

  $('#header h1').text(Context.appName);

  if (Context.env !== "development") {
    $('#header #deploy-btn-group').hide();
  }

  $('#header #open-btn').attr('href', 'http://' + window.location.host);

  // Initialize Bootstrap 5 tooltips for elements annotated with data-bs-title
  if (window.bootstrap && typeof bootstrap.Tooltip === 'function') {
    $('[data-bs-title]').each(function() {
      var title = this.getAttribute('data-bs-title');
      try { new bootstrap.Tooltip(this, { title: title, placement: 'bottom' }); } catch (e) {}
    });
  }

  // Global keyboard shortcut: '?' opens shortcuts modal
  $(document).on('keydown', function(e) {
    var key = e.key || '';
    var tag = (e.target && e.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable) || $(e.target).closest('.ace_editor').length;
    if (typing) return;

    if (key === '?' && window.bootstrap && bootstrap.Modal) {
      e.preventDefault();
      try {
        var el = document.getElementById('shortcut-help');
        if (el) new bootstrap.Modal(el, {}).show();
      } catch (err) {}
    }
  });

});
