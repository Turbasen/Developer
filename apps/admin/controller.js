/* eslint no-unused-vars: 0 */
'use strict';

const router = require('express').Router;

const app = router();
const ApiUser = require('../app/model').ApiUser;

const filters = require('./filters');

if (module.parent.exports.nunjucks) {
  Object.keys(filters).forEach(filter => {
    module.parent.exports.nunjucks.addFilter(filter, filters[filter]);
  });
}

app.use('/', (req, res, next) => {
  if (!req.session.auth.isAdmin) {
    return res.redirect('/');
  }

  return next();
});

app.get('/', (req, res) => res.redirect('/admin/users'));

app.get('/users', (req, res, next) => {
  ApiUser.find().limit(100).sort({ updated: -1 }).exec((err, apps) => {
    if (err) { return next(err); }
    return res.render('admin/users.html', { req, apps });
  });
});

app.get('*', (req, res) => res.redirect('/admin'));

module.exports = app;
