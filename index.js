/* eslint no-console: 0, no-unused-vars: 0 */
'use strict';

const express = require('express');
const raven = require('raven');
const statics = express.static;
const bodyParser = require('body-parser');
const nunjucks = require('nunjucks');
const db = require('./lib/db');

const app = module.exports.app = express();
app.use(raven.middleware.express.requestHandler(process.env.SENTRY_DSN));

app.set('x-powered-by', false);
app.set('trust proxy', 1);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/static', statics(`${__dirname}/static`));
app.use('/themes', statics(`${__dirname}/node_modules/semantic-ui-less/themes`));

module.exports.nunjucks = nunjucks.configure('views', {
  autoescape: true,
  express: app,
  noCache: process.env.NODE_ENV !== 'production',
});

module.exports.nunjucks.addGlobal('foo', 'bar');

app.get('/favicon.ico', (req, res) => {
  res.set('Content-Type', 'image/x-icon');
  res.end();
});

app.use(require('./apps/auth/session'));
app.use(require('./apps/auth/middleware'));
app.use('/', require('./apps/auth/controller'));
app.use('/profile', require('./apps/profile/controller'));
app.use('/app', require('./apps/app/controller'));
app.use('/admin', require('./apps/admin/controller'));
app.use('/email', require('./apps/email/controller'));
app.use('/slack', require('./apps/slack/controller'));

app.get('/', (req, res) => { res.redirect('/app'); });
app.get('*', (req, res) => { res.redirect('/app'); });

app.use(raven.middleware.express.errorHandler(process.env.SENTRY_DSN));

// Error Handler
app.use((err, req, res, next) => {
  if (!err.code) { err.code = 500; }

  if (err.code >= 500) {
    console.error(err);
    console.error(err.stack);
  }

  res.status(err.code || 500);
  res.send(err.message);
});

if (!module.parent) {
  app.listen(8080);
  db.connection.once('open', () => {
    console.log('Server is accepting new connections on port 8080');
  });
}

process.on('SIGINT', process.exit.bind(process, 1));
