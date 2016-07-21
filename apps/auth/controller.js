/* eslint no-console: 0*/
'use strict';

const Router = require('express').Router;
const route = new Router();

const ApiUser = require('../app/model').ApiUser;

const github = require('../../lib/github');
const OAuth2 = require('oauth').OAuth2;
const oauth2 = new OAuth2(
  process.env.GH_OAUTH_CLIENT,
  process.env.GH_OAUTH_SECRET,
  'https://github.com/',
  'login/oauth/authorize',
  'login/oauth/access_token',
  null
);

const qs = require('querystring');
const admins = new Set(process.env.APP_ADMINS.split(','));

route.get('/login', (req, res) => {
  let error;

  if (req.query.error) {
    error = {
      title: `Error: ${req.query.error}`,
      message: req.query.error_description,
    };
  }

  res.render('login.html', { req, error });
});

route.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

route.get('/login/github', (req, res) => {
  const originalUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  const authURL = oauth2.getAuthorizeUrl({
    redirect_uri: `${originalUrl}/callback`,
    scope: 'user:email',
    state: process.env.GH_OAUTH_RANDOM,
  });

  res.redirect(authURL);
});

route.get('/login/github/callback', (req, res, next) => {
  const originalUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  // @TODO validate req.query.state ?
  // @TODO req.query.error + req.query.error_description

  if (req.query.error) {
    console.log(req.query);
    return res.redirect(`/login?${qs.stringify({
      error: req.query.error,
      error_description: req.query.error_description,
    })}`);
  }

  return oauth2.getOAuthAccessToken(
    req.query.code,
    { redirect_uri: originalUrl },
    (err, accessToken, refreshToken, results) => {
      if (err) { return next(err); }
      if (results.error) { return next(new Error(results.error_description)); }

      const auth = { accessToken, refreshToken };

      return github.client(auth).users.get({}, (userErr, userData) => {
        if (userErr) { return next(userErr); }

        req.session.auth = {
          userId: userData.id,
          userName: userData.login,
          email: userData.email,
          fullName: userData.name,
          accessToken,
          refreshToken,
          avatarUrl: userData.avatar_url,
          isAdmin: admins.has(userData.login),
        };

        if (!req.session.auth.isAdmin) {
          return res.redirect('/');
        }

        return ApiUser.aggregate([
          { $unwind: '$apps' },
          { $group: {
            _id: 'TOTOAL',
            active: { $sum: { $cond: ['$apps.active', 1, 0] } },
            inactive: { $sum: { $cond: ['$apps.active', 0, 1] } },
            pending: { $sum: { $cond: [{
              $and: [
                { $eq: ['$apps.approved', false] },
                { $not: ['$apps.rejection'] },
              ],
            }, 1, 0] } },
            request: { $sum: { $cond: [{
              $or: [
                '$apps.limit.prodRequest',
                '$apps.limit.devRequest',
              ],
            }, 1, 0] } },
          } },
        ], (aggregateErr, result) => {
          if (aggregateErr) { return next(aggregateErr); }

          req.session.stats = result[0];
          return res.redirect('/');
        });
      });
    });
});

module.exports = route;
