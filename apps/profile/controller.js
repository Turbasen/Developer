/* eslint no-unused-vars: 0 */
'use strict';

const router = require('express').Router;

const app = router();
const ApiUser = require('../app/model').ApiUser;

const NTB_TOS_VERSION = process.env.NTB_TOS_VERSION || 1;

// get api user for authenticated user
app.use('/', (req, res, next) => {
  const query = {
    'owner.userId': req.session.auth.userId,
  };

  ApiUser.findOne(query, (err, api) => {
    if (err) { return next(err); }

    const name = req.session.auth.fullName || req.session.auth.userName;
    const email = req.session.auth.email;

    req.api = api || new ApiUser({
      provider: name.split(' ').reverse()[0].toUpperCase(),
      contact: { name, email },
    });

    return next();
  });
});

app.get('/', (req, res, next) => {
  const user = req.session.auth;
  const error = req.session.message;

  delete req.session.message;
  res.render('profile/index.html', { req, user, api: req.api, error });
  return;
});

app.post('/link', (req, res, next) => {
  // Existing users can not link their API-key
  if (!req.api.isNew) {
    req.session.message = {
      message: 'Din profil kan ikke linkes til en API-nøkkel!',
      field: 'api_key',
    };

    res.set('x-app-status', 'failure');
    res.set('x-app-message', 'link_forbidden');
    res.redirect(303, '/profile');

    return;
  }

  // Check if api_key is provided
  if (!req.body.api_key) {
    req.session.message = {
      message: 'API-nøkkel kan ikke være tom!',
      field: 'api_key',
    };

    res.set('x-app-status', 'failure');
    res.set('x-app-message', 'empty_key');
    res.redirect(303, '/profile');

    return;
  }

  const query = {
    'apps.key.prod': req.body.api_key,
    owner: { $size: 0 },
  };

  ApiUser.findOne(query).exec((findErr, doc) => {
    if (findErr) { next(findErr); return; }

    if (!doc) {
      req.session.message = {
        message: 'API-nøkkelen eksisterer ikke eller er allerede linket.',
        field: 'api_key',
      };

      res.set('x-app-status', 'failure');
      res.set('x-app-message', 'key_not_found');
      res.redirect(303, '/profile');

      return;
    }

    req.api = doc;

    req.api.owner = req.session.auth;
    req.api.save({ validateBeforeSave: false }, (saveErr) => {
      if (saveErr) { next(saveErr); return; }

      req.session.message = {
        class: 'positive',
        title: 'Profil linket',
        message: 'Din profil ble suksessfullt linket!',
      };

      res.set('x-app-status', 'success');
      res.redirect(303, '/profile');

      return;
    });

    return;
  });

  return;
});

app.post('/', (req, res, next) => {
  const user = req.session.auth;

  // New User
  if (req.api.isNew) {
    req.api.provider = req.body.provider;
    req.api.owner = req.session.auth;
  }

  req.api.contact.name = req.body.name;
  req.api.contact.email = req.body.email;
  req.api.contact.phone = req.body.phone;

  req.api.terms = parseInt(req.body.terms, 10) || 0;
  req.api.notify = req.body.notify === '1';

  const validation = req.api.validateSync();

  if (validation) {
    const key = Object.keys(validation.errors)[0];
    req.session.message = validation.errors[key];

    res.set('x-app-status', 'failure');
    res.set('x-app-message', 'validation_error');
    res.redirect(303, '/profile');

    return;
  }

  req.api.save((saveErr) => {
    if (saveErr && saveErr.code !== 11000) { next(saveErr); return; }

    if (saveErr && saveErr.code === 11000) {
      req.session.message = saveErr;

      res.set('x-app-status', 'failure');
      res.set('x-app-message', 'validation_error');
      res.redirect(303, '/profile');
    } else {
      req.session.message = {
        class: 'positive',
        title: 'Profil oppdatert',
        message: 'Din profil ble suksessfullt oppdatert',
      };

      res.set('x-app-status', 'success');
      res.redirect(303, '/profile');
    }

    return;
  });
  return;
});

module.exports = app;
