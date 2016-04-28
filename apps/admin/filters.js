'use strict';

const moment = require('moment');

module.exports.dateformat = function appFilterShorten(str, format) {
  return moment(str).format(format);
};
