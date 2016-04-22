'use strict';

ci.profile = {};

// ready event
ci.profile.ready = function() {

  // selector cache
  var $contactForm = $('.ui.form.contact');
  var $linkForm = $('.ui.form.link');
  var $checkbox = $contactForm.find('.ui.checkbox');
  var $errorMessage = $('.message .close');

  // event handlers
  var handler = {

  };

  $errorMessage.on('click', function() {
    $(this).closest('.message').transition('fade');
  });

  $checkbox.checkbox();

  $contactForm.form({
    fields: {
      name     : 'empty',
      email    : 'email',
      phone    : 'empty',
      terms    : 'checked',
      provider : 'regExp[/^[A-Z0-9]{3,}$/]',
    }
  });

  $linkForm.form({
    fields: { api_key: 'empty' }
  });
};


// attach ready event
$(document).ready(ci.profile.ready);
