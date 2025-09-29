$(document).ready(function() {

  $('.save').on('click', function(e) {
    e.preventDefault();
    var $error = $('#error');
    $error.addClass('d-none');
    var key = $.trim($('textarea[name=key]').val());

    $.cookie('DpdSshKey', key);

    $.ajaxSetup({
      headers: {
        'dpd-ssh-key': key || true
      }
    });

    dpd('dashboard').get('__is-root', function(res) {
      if (res && res.isRoot) {
        window.location.reload();
      } else {
        $error.removeClass('d-none');
      }
    });
  });

});

