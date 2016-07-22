'use strict';

const slackr = require('slackr');
const Router = require('express').Router;
const route = new Router();

const ApiUser = require('./model').ApiUser;
const filters = require('./filters');

const APPS_FREE = process.env.APPS_FREE || 1;

if (module.parent.exports.nunjucks) {
  Object.keys(filters).forEach(filter => {
    module.parent.exports.nunjucks.addFilter(filter, filters[filter]);
  });
}

// get api user for authenticated user
route.use('/', (req, res, next) => {
  const query = {
    'owner.userId': req.session.auth.userId,
  };

  ApiUser.findOne(query, (err, api) => {
    if (err) { return next(err); }
    req.api = api;
    return next();
  });
});

// redirect user to profile
route.use('/', (req, res, next) => {
  if (!req.api || req.api.validateSync()) {
    return res.redirect('/profile');
  }

  return next();
});

route.use('/', (req, res, next) => {
  if (req.api.apps.length === 0 && /^\/app\/?$/.test(req.originalUrl)) {
    return res.redirect('/app/new');
  }

  return next();
});

route.get('/', (req, res) => {
  const error = req.session.message;
  delete req.session.message;

  res.render('app/index.html', { req, keys: req.api.apps, error });
});

route.get('/new', (req, res) => {
  let error = req.session.message;
  delete req.session.message;

  if (!error && req.api.apps.length >= APPS_FREE) {
    error = {
      class: 'info',
      title: 'Godkjenning kreves',
      message: 'Nye applikasjoner gå gjennom godkjenning før de blir aktiv.',
    };
  }

  res.render('app/new.html', { req, error });
});

route.post('/new', (req, res, next) => {
  const app = req.api.apps.create({
    name: req.body.name,
    url: req.body.url || undefined,
    desc: req.body.desc,
    active: req.api.apps.length < APPS_FREE,
    approved: req.api.apps.length < APPS_FREE,
  });

  // Add the new application to the user
  req.api.apps.push(app);

  const error = req.api.validateSync();
  if (error) {
    const key = Object.keys(error.errors)[0];
    req.session.message = error.errors[key];

    res.set('x-app-status', 'failure');
    res.set('x-app-message', 'validation_error');
    res.redirect(303, '/app/new');
    return;
  }

  req.api.save(err => {
    if (err) { next(err); return; }

    // Construct Slack notification message
    const message = {
      text: 'En ny applikasjon har blitt registrert :tada:',
      attachments: [app.slackAttachment()],
    };

    // Warn about pending app approval.
    if (!app.approved) {
      req.session.message = {
        class: 'info',
        title: 'Venter på godkjenning',
        message: 'Din applikasjon venter på godkjenning.',
      };

      res.set('x-app-message', 'pending');

      // Add interactive Slack buttons for easy approval
      message.attachments.push(app.slackRequestApproval());

    // Inform about app created.
    } else {
      req.session.message = {
        class: 'positive',
        title: 'App opprettet',
        message: 'Din applikasjon ble suksessfullt opprettet.',
      };
    }

    // Post message to Slack
    slackr(message);

    res.set('x-app-status', 'success');
    res.redirect(303, '/app');
  });
});

route.param('id', (req, res, next, id) => {
  req.app = req.api.apps.id(id);

  if (!req.app) {
    req.session.message = {
      title: 'Lagring feilet',
      message: 'Applikasjon ble ikke funnet!',
    };

    res.set('x-app-status', 'failure');
    res.set('x-app-message', 'app_not_found');
    res.redirect(303, '/app');

    return;
  }

  next();
});

route.post('/:id', (req, res, next) => {
  req.app.set('name', req.body.name);
  req.app.set('url', req.body.url || undefined);
  req.app.set('desc', req.body.desc);

  // Prod rate-limit change request
  if (parseInt(req.body.limit_prod, 10) !== req.app.limit.prod) {
    req.app.limit.prodRequest = parseInt(req.body.limit_prod, 10);
  } else {
    req.app.limit.prodRequest = undefined;
  }

  // Dev rate-limit change request
  if (parseInt(req.body.limit_dev, 10) !== req.app.limit.dev) {
    req.app.limit.devRequest = parseInt(req.body.limit_dev, 10);
  } else {
    req.app.limit.devRequest = undefined;
  }

  const error = req.api.validateSync();
  if (error) {
    req.session.message = error[0];

    res.set('x-app-status', 'failure');
    res.set('x-app-message', 'validation_error');
    res.redirect(303, '/app');

    return;
  }

  req.api.save(saveErr => {
    if (saveErr) { next(saveErr); return; }

    req.session.message = {
      class: 'positive',
      title: 'App ppdatert',
      message: `Applikasjon "${req.body.name}" ble oppdatert suksessfullt.`,
      app: req.app._id,
    };

    res.set('x-app-status', 'success');
    res.redirect(303, '/app');

    return;
  });

  return;
});

route.post('/:id/disable', (req, res, next) => {
  req.app.active = false;
  req.api.save(saveErr => {
    if (saveErr) { next(saveErr); return; }

    req.session.message = {
      class: 'positive',
      title: 'App deaktivert',
      message: `Applikasjon "${req.app.name}" ble deaktivert!`,
      app: req.app._id,
    };

    res.set('x-app-status', 'success');
    res.redirect(303, '/app');

    return;
  });
});

route.get('*', (req, res) => res.redirect('/app'));

module.exports = route;
