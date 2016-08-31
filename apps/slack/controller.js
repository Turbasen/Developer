/* eslint no-unused-vars: 0 */
'use strict';

const HttpError = require('@starefossen/node-http-error');
const Router = require('express').Router;
const ApiUser = require('./../app/model').ApiUser;

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

// Parse JSON payload
route.use('/action', (req, res, next) => {
  if (req.body && req.body.payload) {
    req.body = JSON.parse(req.body.payload);
  } else {
    req.body = {};
  }

  next();
});

// Verify Slack token
route.use('/action', (req, res, next) => {
  if (req.body.token !== process.env.SLACK_VERIFICATION_TOKEN) {
    return next(new HttpError('Missing or invalid verification token', 401));
  }

  return next();
});

// Fetch App
route.use('/action', (req, res, next) => {
  const [action, userId, appId] = req.body.callback_id.split('/');

  req.body.action = action;

  ApiUser.findOne({ _id: userId }, (err, api) => {
    if (err) { return next(new HttpError('Database failed', 500)); }
    if (!api) { return next(new HttpError(`API user "${userId}" not found`, 404)); }

    const app = req.apiApp = api.apps.id(appId);
    if (!app) { return next(new HttpError(`API app "${appId}" not found`, 404)); }

    return next();
  });
});

route.post('/action', (req, res, next) => {
  let promise;
  let message;

  const user = req.body.user.name;

  if (req.body.action === 'requests') {
    if (req.body.actions[0].value === 'true') {
      promise = req.apiApp.approve();
      message = `:white_check_mark: @${user} godkjennte denne appikasjonen`;
    } else {
      promise = req.apiApp.reject();
      message = `:x: @${user} avviste denne applikasjonen`;
    }
  } else {
    return next(new HttpError(`Invalid Salck action "${req.body.action}"`, 400));
  }

  const slackMessage = req.body.original_message;

  slackMessage.attachments = slackMessage.attachments.map(attachment => {
    if (attachment.id === req.body.attachment_id) {
      return { id: attachment.id, text: message };
    }

    return attachment;
  });

  return promise.catch(next).then(() => res.json(slackMessage));
});

route.get('*', (req, res) => res.redirect('/'));

module.exports = route;
