/* eslint no-unused-vars: 0 */
'use strict';

const router = require('express').Router;

const app = router();
const ApiUser = require('../app/model').ApiUser;

const filters = require('./filters');
const sendgrid = require('../../lib/sendgrid');

if (module.parent.exports.nunjucks) {
  Object.keys(filters).forEach(filter => {
    module.parent.exports.nunjucks.addFilter(filter, filters[filter]);
  });
}

app.use('/', (req, res, next) => {
  if (!req.session.auth.isAdmin) {
    return res.redirect('/');
  }

  return next();
});

app.get('/', (req, res) => res.redirect('/admin/users'));

app.get('/users', (req, res, next) => {
  ApiUser.find().limit(100).sort({ updated: -1 }).exec((err, apps) => {
    if (err) { return next(err); }
    return res.render('admin/users.html', { req, apps });
  });
});

app.get('/email', (req, res) => {
  const error = req.session.message;

  delete req.session.message;
  res.render('admin/email.html', { req });
});

app.post('/email', (req, res, next) => {
  const query = { 'owner.userId': req.session.auth.userId };
  const template = req.body.content;
  const context = {
    site: {
      url: `${req.protocol}://${req.get('host')}`,
    }
  };

  if (req.body.send) {
    // @TODO
  } else {
    ApiUser.findOne(query, (err, api) => {
      if (err) { return next(err); }

      context.api = api;
      context.user = api.contact;

      sendgrid.renderTemplate(template, context, (err, data) => {
        if (err && err.name == 'Template render error') {
          const error = { message: err.toString() };
          return res.render('admin/email.html', { req, error, body: req.body });
        } else if (err) {
          return next(err);
        }

        if (req.body.test) {
          // @TODO
        } else {
          return res.render('admin/email.html', {
            req,
            body: req.body,
            preview: data,
          });
        }
      });
    });
  }
});

app.get('*', (req, res) => res.redirect('/admin'));

module.exports = app;
