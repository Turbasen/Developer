/* eslint no-unused-vars: 0 */
'use strict';

const each = require('async-each-map');
const Router = require('express').Router;
const route = new Router();

const ApiUser = require('../app/model').ApiUser;

const filters = require('./filters');
const sendgrid = require('../../lib/sendgrid');
const keygen = require('../../lib/keygen');

if (module.parent.exports.nunjucks) {
  Object.keys(filters).forEach(filter => {
    module.parent.exports.nunjucks.addFilter(filter, filters[filter]);
  });
}

route.use('/', (req, res, next) => {
  if (!req.session.auth.isAdmin) {
    return res.redirect('/');
  }

  return next();
});

route.get('/', (req, res) => res.redirect('/admin/users'));

route.get('/users', (req, res, next) => {
  ApiUser.find().limit(100).sort({ updated: -1 }).exec((err, apps) => {
    if (err) { return next(err); }
    return res.render('admin/users.html', { req, apps });
  });
});

route.get('/users/:id', (req, res, next) => {
  ApiUser.findOne({ _id: req.params.id }).exec((err, user) => {
    if (err) { return next(err); }
    return res.render('admin/user.html', { req, user });
  });
});

route.get('/limits', (req, res, next) => {
  const error = req.session.message;
  delete req.session.message;

  const query = {
    apps: {
      $elemMatch: {
        $or: [
          { 'limit.prodRequest': { $exists: true } },
          { 'limit.devRequest': { $exists: true } },
        ],
      },
    },
  };

  ApiUser.find(query).exec((err, users) => {
    if (err) { return next(err); }
    return res.render('admin/limits.html', { req, error, users });
  });
});

route.post('/users/:userId/apps/:appId', (req, res, next) => {
  const promise = ApiUser.findOne({ 'apps._id': req.params.appId });

  promise.then(user => {
    req.app = user.apps.id(req.params.appId);

    req.app.set('name', req.body.name);
    req.app.set('url', req.body.url || undefined);
    req.app.set('desc', req.body.desc);

    if (req.body.generate_key_dev) {
      req.app.set('key.dev', keygen());
    }

    if (req.body.generate_key_prod) {
      req.app.set('key.prod', keygen());
    }

    req.app.limit.prod = parseInt(req.body.limit_prod, 10);
    req.app.limit.prodRequest = undefined;

    req.app.limit.dev = parseInt(req.body.limit_dev, 10);
    req.app.limit.devRequest = undefined;

    const error = user.validateSync();

    if (error) {
      req.session.message = error[0];

      res.set('x-app-status', 'failure');
      res.set('x-app-message', 'validation_error');
      res.redirect(303, `/admin/users/${req.params.userId}`);

      return;
    }

    user.save(saveErr => {
      if (saveErr) { next(saveErr); return; }

      req.session.message = {
        class: 'positive',
        title: 'App oppdatert',
        message: `Applikasjonen «${req.body.name}» ble oppdatert.`,
        app: req.app._id,
      };

      res.set('x-app-status', 'success');
      res.redirect(303, `/admin/users/${req.params.userId}`);

      return;
    });

    return;
  });
});

route.post('/limits/:userId/:appId', (req, res, next) => {
  ApiUser.findOne({ _id: req.params.userId }, (err, user) => {
    if (err) { return next(err); }

    const app = user.apps.id(req.params.appId);

    // Unknown application
    if (!app) {
      req.session.message = {
        title: 'Ukjent app',
        message: `App ${req.params.appId} ble ikke funnet`,
      };

      return res.redirect(303, '/admin/limits');
    }

    // Approve new limits
    if (req.body.approve === 'true') {
      if (req.body.limit_prod) {
        app.set('limit.prod', parseInt(req.body.limit_prod, 10));
      }

      if (req.body.limit_dev) {
        app.set('limit.dev', parseInt(req.body.limit_dev, 10));
      }

      app.set('limit.prodRequest', undefined);
      app.set('limit.devRequest', undefined);

      req.session.message = {
        class: 'positive',
        title: 'Ny grense godkjent',
        message: `Ny grense for "${app.name}" er godkjent.`,
      };

    // Reject new limits
    } else if (req.body.reject === 'true') {
      app.set('limit.prodRequest', undefined);
      app.set('limit.devRequest', undefined);

      req.session.message = {
        class: 'positive',
        title: 'Ny grense avslått',
        message: `Ny grense for "${app.name}" er avslått.`,
      };

    // Unknown action
    } else {
      req.session.message = {
        title: 'Ukjent valg',
        message: 'Operasjonen ble ikke gjennkjennt som et gyldig valg.',
      };

      return res.redirect(303, '/admin/limits');
    }

    return user.save().catch(next).then(() => res.redirect(303, '/admin/limits'));
  });
});

route.get('/requests', (req, res, next) => {
  const error = req.session.message;
  delete req.session.message;

  const query = {
    apps: {
      $elemMatch: {
        approved: false,
        rejection: { $exists: false },
      },
    },
  };

  ApiUser.find(query).exec((err, users) => {
    if (err) { return next(err); }
    return res.render('admin/requests.html', { req, error, users });
  });
});

route.post('/requests/:userId/:appId', (req, res, next) => {
  ApiUser.findOne({ _id: req.params.userId }, (err, user) => {
    if (err) { return next(err); }

    const app = user.apps.id(req.params.appId);

    // Unknown application
    if (!app) {
      req.session.message = {
        title: 'Ukjent app',
        message: `App ${req.params.appId} ble ikke funnet`,
      };

      return res.redirect(303, '/admin/requests');
    }

    // Approve application
    if (req.body.approve === 'true') {
      app.set('active', true);
      app.set('approved', true);

      req.session.message = {
        class: 'positive',
        title: 'Ny app godkjent',
        message: `Applikasjonen "${app.name}" ble godkjent.`,
      };

    // Reject application
    } else if (req.body.reject === 'true') {
      app.set('active', false);
      app.set('approved', false);
      app.set('rejection', req.body.message || 'Ingen melding oppgitt.');

      req.session.message = {
        class: 'positive',
        title: 'Ny app avslått',
        message: `Applikasjonen "${app.name}" ble avslått.`,
      };

    // Unknown action
    } else {
      req.session.message = {
        title: 'Ukjent valg',
        message: 'Operasjonen ble ikke gjennkjennt som et gyldig valg.',
      };

      return res.redirect(303, '/admin/requests');
    }

    return user.save().catch(next).then(() => res.redirect(303, '/admin/requests'));
  });
});

route.get('/email', (req, res) => {
  const error = req.session.message;

  delete req.session.message;
  res.render('admin/email.html', { req });
});

route.post('/email', (req, res, next) => {
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

route.get('*', (req, res) => res.redirect('/admin'));

module.exports = route;
