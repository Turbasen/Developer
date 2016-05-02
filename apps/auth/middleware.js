'use strict';

const github = require('../../lib/github');
// const User = require('./model').User;

module.exports = function authMiddleware(req, res, next) {
  if (!req.session) {
    req.session = {};
  }

  if (!req.session.auth
      && !/^\/favicon.ico/.test(req.originalUrl)
      && !/^\/login/.test(req.originalUrl)
      && !/^\/email/.test(req.originalUrl)
  ) {
    return res.redirect('/login');
  }

  if (req.session.auth) {
    if (!req.session.auth.accessToken) {
      throw new Error(`Missing accessToken for user ${req.session.auth.userName}`);
    }

    req.github = github.client(req.session.auth);
  }

  return next();
};
