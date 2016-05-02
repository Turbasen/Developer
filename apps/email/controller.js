/* eslint no-unused-vars: 0 */
'use strict';

const router = require('express').Router;

const app = router();
const ApiUser = require('../app/model').ApiUser;

app.get('/', (req, res) => res.redirect('/email/unsubscribe'));

app.get('/unsubscribe', (req, res, next) => {
  if (req.session.auth) {
    res.redirect('/profile');
  } else {
    next();
  }
});

app.get('/unsubscribe', (req, res, next) => {
  const error = req.session.message;

  delete req.session.message;
  res.render('email/unsubscribe.html', { req, error });
});

app.get('/unsubscribed', (req, res, next) => {
  const error = {
    class: 'positive',
    title: 'Avmelding gjennomført',
    message: 'Du vil ikke lenger motta epost fra Nasjonal Turbase.',
  };

  res.render('email/unsubscribed.html', { req, error });
});

app.post('/unsubscribe', (req, res, next) => {
  if (!req.body.email) {
    req.session.message = {
      title: 'Avmelding feilet',
      message: 'Epost kan ikke være tom',
    };

    res.set('x-app-status', 'failure');
    res.set('x-app-message', 'empty_email');
    return res.redirect(303, '/email/unsubscribe');
  }

  return ApiUser.findOne({ 'contact.email': req.body.email }, (findErr, user) => {
    if (findErr) { return res.redirect('/email/unsubscribe'); }
    if (!user) { return res.redirect(303, '/email/unsubscribed'); }

    user.notify = false;
    return user.save({ validateBeforeSave: false }, (saveErr) => {
      if (saveErr) { return res.redirect(303, '/email/unsubscribe'); }
      return res.redirect(303, '/email/unsubscribed');
    });
  });
});

app.get('/unsubscribe/:id', (req, res, next) => {
  ApiUser.findOne({ _id: req.params.id }, (findErr, user) => {
    if (findErr) { return res.redirect(303, '/email/unsubscribe'); }
    if (!user) { return res.redirect(303, '/email/unsubscribed'); }

    user.notify = false;
    return user.save({ validateBeforeSave: false }, (saveErr) => {
      if (saveErr) { return res.redirect(303, '/email/unsubscribe'); }
      return res.redirect(303, '/email/unsubscribed');
    });
  });
});

app.get('*', (req, res) => res.redirect('/email'));

module.exports = app;
