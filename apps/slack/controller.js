/* eslint no-unused-vars: 0 */
'use strict';

const HttpError = require('@starefossen/node-http-error');
const Router = require('express').Router;

const route = new Router();

route.get('/oauth', (req, res, next) => {
  if (!req.query.code) {
    return next(new HttpError('Missing "code" query parameter', 400));
  }

  const base = 'https://slack.com/api/oauth.access';
  const code = req.query.code;
  const client = process.env.SLACK_OAUTH_CLIENT;
  const secret = process.env.SLACK_OAUTH_SECRET;

  return res.redirect(`${base}?code=${code}&client_id=${client}&client_secret=${secret}`);
});

route.use('/action', (req, res, next) => {
  next();
});

route.post('/action', (req, res, next) => {
  console.log(req.body); // eslint-disable-line
  res.json({ text: 'Work in progress :shipit:' });
});

route.get('*', (req, res) => res.redirect('/'));

module.exports = route;
