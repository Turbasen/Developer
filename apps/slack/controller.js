/* eslint no-unused-vars: 0 */
'use strict';

const HttpError = require('@starefossen/node-http-error');
const router = require('express').Router;

const app = router();

app.get('/oauth', (req, res, next) => {
  if (!req.query.code) {
    return next(new HttpError('Missing "code" query parameter', 400));
  }

  const base = 'https://slack.com/api/oauth.access';
  const code = req.query.code;
  const client = process.env.SLACK_OAUTH_CLIENT;
  const secret = process.env.SLACK_OAUTH_SECRET;

  return res.redirect(`${base}?code=${code}&client_id=${client}&client_secret=${secret}`);
});

app.get('*', (req, res) => res.redirect('/'));

module.exports = app;
