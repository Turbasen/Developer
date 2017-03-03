var ci = {};

var clipboard = new Clipboard('.button.copy');

clipboard.on('success', function(e) {
  console.log(e);
});

$('.button.copy').on('click', function(e) {
  e.preventDefault();
});

$('.button.keygen').on('click', function(e) {
  $.post('/app/keygen', $.proxy(function(data) {
    $(this).prevAll('input').first().val(data.key);
  }, this));
  e.preventDefault();
});
