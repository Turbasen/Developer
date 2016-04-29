'use strict';

ci.page = {};

// ready event
ci.page.ready = function() {
  var $form = $('form.ui.form');
  var $content = $form.find('[name="content"]');
  var $checkbox = $form.find('.checkbox');

  $checkbox.checkbox();

  $content.trumbowyg({
    svgPath: '/static/images/icons.svg',
    autogrow: true,
    btns: [
      ['viewHTML'],
      ['formatting'],
      'btnGrp-semantic',
      ['link'],
      ['insertImage'],
      'btnGrp-justify',
      'btnGrp-lists',
      ['horizontalRule'],
      ['removeformat'],
    ]
  });
};

// attach ready event
$(document).ready(ci.page.ready);
