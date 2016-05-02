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

module.exports.sendTemplate = (template, subject, from, to, cb) => {
  const email = new sendgrid.Email();

  email.addTo(to);
  email.subject = subject;
  email.from = from;
  email.html = template;
  email.text = email.html.replace(/(<([^>]+)>)/ig, '');

  email.addFilter('templates', 'enable', 1);
  email.addFilter('templates', 'template_id', process.env.SENDGRID_TEMPLATE_ID);

  email.addCategory('turbasen/developer');

  sendgrid.send(email, cb);
};
