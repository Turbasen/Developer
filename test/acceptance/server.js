/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
'use strict';

const supertest = require('supertest');
const req = supertest(require('../../').app);

describe('GET /favicon.ico', () => {
  const url = '/favicon.ico';

  it('returns about page', (done) => {
    req.get(url)
      .expect('Content-Type', 'image/x-icon')
      .expect(200, done);
  });
});

describe('GET /', () => {
  const url = '/';

  it('redirects to login for unathenticated user', (done) => {
    req.get(url)
      .expect('Location', '/login')
      .expect(302, done);
  });

  it('redirect to app for authenticated user', (done) => {
    req.get(url)
      .set('Cookie', process.env.USER_WITH_APPS_COOKIE)
      .expect('Location', '/app')
      .expect(302, done);
  });
});
