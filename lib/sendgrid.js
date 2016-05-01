'use strict';

const nunjucks = require('nunjucks');
const sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY);

module.exports = sendgrid;

module.exports.renderTemplate = (template, context, cb) => {
  try {
    return cb(null, nunjucks.renderString(template, context));
  } catch (err) {
    return cb(err);
  }
};
