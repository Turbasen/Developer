var ci = {};

var clipboard = new Clipboard('.button.copy');

clipboard.on('success', function(e) {
  console.log(e);
});

$('.button.copy').on('click', function(e) {
  e.preventDefault();
});
