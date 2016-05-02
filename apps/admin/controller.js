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
  const from = req.body.from;
  const subject = req.body.subject;
  const template = req.body.content;

  const context = {
    site: {
      url: `${req.protocol}://${req.get('host')}`,
    },
  };

  if (req.body.send) {
    // @TODO
    res.end();
  } else {
    const query = { 'owner.userId': req.session.auth.userId };

    ApiUser.findOne(query, (findErr, api) => {
      if (findErr) { return next(findErr); }

      context.api = api;
      context.user = api.contact;

      return sendgrid.renderTemplate(template, context, (tempErr, rendered) => {
        if (tempErr && tempErr.name === 'Template render error') {
          const error = { message: tempErr.toString() };
          return res.render('admin/email.html', { req, error, body: req.body });
        } else if (tempErr) {
          return next(tempErr);
        }

        if (req.body.test) {
          const to = req.session.auth.email;

          return sendgrid.sendTemplate(rendered, subject, from, to, (sendErr, data) => {
            let error;

            if (sendErr) {
              error = sendErr;
            } else {
              error = {
                title: 'Test sendt',
                message: `Epost ble sendt til ${to}`,
                class: 'positive',
              };
            }

            res.render('admin/email.html', { req, error, body: req.body });
          });
        }

        return res.render('admin/email.html', {
          req,
          body: req.body,
          preview: data,
        });
      });
    });
  }
});

app.get('*', (req, res) => res.redirect('/admin'));

module.exports = app;
