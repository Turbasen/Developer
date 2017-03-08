var ci = {};

var clipboard = new Clipboard('.button.copy');

clipboard.on('success', function(e) {
  console.log(e);
});

$('.button.copy').on('click', function(e) {
  e.preventDefault();
});

$('input[name^="generate_key"]').on('change', function(e) {
  if (e.target.checked) {
    $(e.target).parent().nextAll('.message').addClass('visible');
  } else {
    $(e.target).parent().nextAll('.message').removeClass('visible');
  }
});
