'use strict';

const router = require('express').Router;

const app = router();
const ApiUser = require('./model').ApiUser;

const filters = require('./filters');

const APPS_FREE = process.env.APPS_FREE || 1;

if (module.parent.exports.nunjucks) {
  Object.keys(filters).forEach(filter => {
    module.parent.exports.nunjucks.addFilter(filter, filters[filter]);
  });
}

// get api user for authenticated user
app.use('/', (req, res, next) => {
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
app.use('/', (req, res, next) => {
  if (!req.api || req.api.validateSync()) {
    return res.redirect('/profile');
  }

  return next();
});

app.use('/', (req, res, next) => {
  if (req.api.apps.length === 0 && /^\/app\/?$/.test(req.originalUrl)) {
    return res.redirect('/app/new');
  }

  return next();
});

app.get('/', (req, res) => {
  const error = req.session.message;
  delete req.session.message;

  res.render('app/index.html', { req, keys: req.api.apps, error });
});

app.get('/new', (req, res) => {
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

app.post('/new', (req, res, next) => {
  req.api.apps.push(req.api.apps.create({
    name: req.body.name,
    url: req.body.url,
    desc: req.body.desc,
    active: req.api.apps.length < APPS_FREE,
    approved: req.api.apps.length < APPS_FREE,
  }));

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

    if (req.api.apps.length > APPS_FREE) {
      req.session.message = {
        class: 'info',
        title: 'Venter på godkjenning',
        message: 'Din applikasjon venter på godkjenning.',
      };
      res.set('x-app-message', 'pending');
    } else {
      req.session.message = {
        class: 'positive',
        title: 'App oppdatert',
        message: 'Din applikasjon ble suksessfullt opprettet.',
      };
    }

    res.set('x-app-status', 'success');
    res.redirect(303, '/app');
  });
});

app.param('id', (req, res, next, id) => {
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

app.post('/:id', (req, res, next) => {
  req.app.name = req.body.name;
  req.app.url = req.body.url;
  req.app.desc = req.body.desc;

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

app.post('/:id/disable', (req, res, next) => {
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

module.exports = app;
