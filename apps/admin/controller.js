/* eslint no-unused-vars: 0 */
'use strict';

const router = require('express').Router;
const each = require('async-each-map');

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

  // Send to all
  if (req.body.send) {
    const query = { 'contact.email': { $exists: true } };

    if (req.body.github || req.body.nogithub) {
      query['owner.0'] = { $exists: !!req.body.github };
    }

    ApiUser.find(query, (findErr, apis) => {
      if (findErr) { return next(findErr); }

      return each(apis, (api, cont) => {
        context.api = api;
        context.user = api.contact;

        sendgrid.renderTemplate(template, context, (tempErr, rendered) => {
          if (tempErr) { return cont(tempErr); }

          let to = api.contact.email;

          // Send to author if env is not production
          if (process.env.NODE_ENV !== 'production') {
            to = req.session.auth.email;
          }

          return sendgrid.sendTemplate(rendered, subject, from, to, sendErr => {
            if (sendErr) { return cont(sendErr); }
            return cont();
          });
        });
      }, apiErr => {
        let error;

        if (apiErr) {
          error = apiErr;
          error.title = 'Epost feilet';
        } else {
          error = {
            title: 'Epost sendt',
            message: `Epost ble sendt til ${apis.length} brukere.`,
            class: 'positive',
          };
        }

        res.render('admin/email.html', { req, error, body: req.body });
      });
    });

  // Preview and Test
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

        // Send Test
        if (req.body.test) {
          const to = req.session.auth.email;

          return sendgrid.sendTemplate(rendered, subject, from, to, sendErr => {
            let error;

            if (sendErr) {
              error = sendErr;
              error.title = 'Test feilet';
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

        // Render Preview
        return res.render('admin/email.html', {
          req,
          body: req.body,
          preview: rendered,
        });
      });
    });
  }
});

app.get('*', (req, res) => res.redirect('/admin'));

module.exports = app;
