/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
'use strict';

const supertest = require('supertest');
const req = supertest(require('../../').app);
const ApiUser = require('../../apps/app/model').ApiUser;

describe('GET /slack', () => {
  const url = '/slack';

  it('redirects back to index', done => {
    req.get(url)
      .expect(302)
      .expect('Location', '/', done);
  });
});

describe('GET /slack/oauth', () => {
  const url = '/slack/oauth';

  it('returns error for missing code query parameter', done => {
    req.get(url)
      .expect(400)
      .expect('Missing "code" query parameter', done);
  });

  it('redirects back to Slack OAuth access endpoint', done => {
    req.get(`${url}?code=fooabr`)
      .expect(302)
      .expect('Location', /slack.com\/api\/oauth.access/, done);
  });
});
