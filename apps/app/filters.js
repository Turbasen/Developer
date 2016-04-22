'use strict';

module.exports.shorten = function appFilterShorten(str, count) {
  return str.slice(0, count || 5);
};

module.exports.nl2br = function appFilterNl2br(str) {
  return str.replace(/\n/g, '<br>');
};
