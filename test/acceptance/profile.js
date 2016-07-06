/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
'use strict';

const assert = require('assert');
const supertest = require('supertest');
const req = supertest(require('../../').app);

const ApiUser = require('../../apps/app/model').ApiUser;

describe('GET /profile', () => {
  const url = '/profile';

  it('redirects to login for unauthenticated user', done => {
    req.get(url)
     .expect(302)
     .expect('Location', '/login', done);
  });

  it('returns profile form for new user', done => {
    req.get(url)
      .set('Cookie', process.env.USER_NO_PROFILE_COOKIE)
      .expect(200, done);
  });

  it('returns profile form for existin user', done => {
    req.get(url)
      .set('Cookie', process.env.USER_WITH_APPS_COOKIE)
      .expect(200, done);
  });
});

describe('POST /profile/link', () => {
  const url = '/profile/link';

  it('returns error for linking existing profile', (done) => {
    req.post(url)
      .set('Cookie', process.env.USER_WITH_APPS_COOKIE)
      .type('form')
      .send({ api_key: 'fookey' })
      .expect('x-app-status', 'failure')
      .expect('x-app-message', 'link_forbidden')
      .expect(303, done);
  });

  it('returns error for linking empty api key', (done) => {
    req.post(url)
      .set('Cookie', process.env.USER_NO_PROFILE_COOKIE)
      .type('form')
      .expect('x-app-status', 'failure')
      .expect('x-app-message', 'empty_key')
      .expect(303, done);
  });

  it('returns error for linking invalid api key', (done) => {
    req.post(url)
      .set('Cookie', process.env.USER_NO_PROFILE_COOKIE)
      .type('form')
      .send({ api_key: 'abc123' })
      .expect('x-app-status', 'failure')
      .expect('x-app-message', 'key_not_found')
      .expect(303, done);
  });

  it('links new profile to existing api key', (done) => {
    req.post(url)
      .set('Cookie', process.env.USER_NO_PROFILE_COOKIE)
      .type('form')
      .send({ api_key: 'fookey' })
      .expect(303, done);
  });
});

describe('POST /profile', () => {
  const url = '/profile';

  it('returns error for empty provider name', (done) => {
    req.post(url)
      .set('Cookie', process.env.USER_NO_PROFILE_COOKIE)
      .type('form')
      .send({
        name: 'Foo Bar',
        email: 'foo@bar.com',
        phone: '99988777',
        terms: '1',
      })
      .expect('x-app-status', 'failure')
      .expect('x-app-message', 'validation_error')
      .expect(303, done);
  });

  it('returns error for invalid provider name', (done) => {
    req.post(url)
      .set('Cookie', process.env.USER_NO_PROFILE_COOKIE)
      .type('form')
      .send({
        provider: 'Foo Bar',
        name: 'Foo Bar',
        email: 'foo@bar.com',
        phone: '99988777',
        terms: '1',
      })
      .expect('x-app-status', 'failure')
      .expect('x-app-message', 'validation_error')
      .expect(303, done);
  });

  it('returns error for duplicate provider name', (done) => {
    req.post(url)
      .set('Cookie', process.env.USER_NO_PROFILE_COOKIE)
      .type('form')
      .send({
        provider: 'FOO',
        name: 'Foo Bar',
        email: 'foo@bar.com',
        phone: '99988777',
        terms: '1',
      })
      .expect('x-app-status', 'failure')
      .expect('x-app-message', 'validation_error')
      .expect(303, done);
  });

  it('returns error for empty name', (done) => {
    req.post(url)
      .set('Cookie', process.env.USER_NO_PROFILE_COOKIE)
      .type('form')
      .send({
        provider: 'FOOBAR',
        email: 'foo@bar.com',
        phone: '99988777',
        terms: '1',
      })
      .expect('x-app-status', 'failure')
      .expect('x-app-message', 'validation_error')
      .expect(303, done);
  });

  it('returns error for empty email', (done) => {
    req.post(url)
      .set('Cookie', process.env.USER_NO_PROFILE_COOKIE)
      .type('form')
      .send({
        provider: 'FOOBAR',
        name: 'Foo Bar',
        phone: '99988777',
        terms: '1',
      })
      .expect('x-app-status', 'failure')
      .expect('x-app-message', 'validation_error')
      .expect(303, done);
  });

  it('returns error for empty phone', (done) => {
    req.post(url)
      .set('Cookie', process.env.USER_NO_PROFILE_COOKIE)
      .type('form')
      .send({
        provider: 'FOOBAR',
        name: 'Foo Bar',
        email: 'foo@bar.com',
        terms: '1',
      })
      .expect('x-app-status', 'failure')
      .expect('x-app-message', 'validation_error')
      .expect(303, done);
  });

  it('returns error for empty tos', (done) => {
    req.post(url)
      .set('Cookie', process.env.USER_NO_PROFILE_COOKIE)
      .type('form')
      .send({
        provider: 'FOOBAR',
        name: 'Foo Bar',
        email: 'foo@bar.com',
        phone: '99988777',
      })
      .expect('x-app-status', 'failure')
      .expect('x-app-message', 'validation_error')
      .expect(303, done);
  });

  it('creates a new profile to the database', (done) => {
    req.post(url)
      .set('Cookie', process.env.USER_NO_PROFILE_COOKIE)
      .type('form')
      .send({
        provider: 'FOOBAR',
        name: 'Foo Bar',
        email: 'foo@bar.com',
        phone: '99988777',
        terms: '1',
      })
      .expect('x-app-status', 'success')
      .expect(303)
      .end(err => {
        if (err) { return done(err); }

        const query = { 'owner.userName': process.env.USER_NO_PROFILE_OWNER };
        const proj = '';
        const opts = {};

        return ApiUser.findOne(query, proj, opts, (mongoErr, api) => {
          if (mongoErr) { return done(mongoErr); }

          assert.equal(api.provider, 'FOOBAR');
          assert.equal(api.contact.name, 'Foo Bar');
          assert.equal(api.contact.email, 'foo@bar.com');
          assert.equal(api.contact.phone, '99988777');
          assert.equal(api.terms, 1);
          assert.equal(api.notify, false);

          return done();
        });
      });
  });

  it('updates invalid profile in the database', (done) => {
    req.post(url)
      .set('Cookie', process.env.USER_INVALID_PROFILE_COOKIE)
      .type('form')
      .send({
        provider: 'FOOBAR',
        name: 'Foo Bar',
        email: 'foo@bar.com',
        phone: '99988777',
        terms: '1',
      })
      .expect('x-app-status', 'success')
      .expect(303)
      .end(err => {
        if (err) { return done(err); }

        const query = { 'owner.userName': process.env.USER_INVALID_PROFILE_OWNER };
        const proj = '';
        const opts = {};

        return ApiUser.findOne(query, proj, opts, (mongoErr, api) => {
          if (mongoErr) { return done(mongoErr); }

          assert.equal(api.provider, 'BAR');
          assert.equal(api.contact.name, 'Foo Bar');
          assert.equal(api.contact.email, 'foo@bar.com');
          assert.equal(api.contact.phone, '99988777');
          assert.equal(api.terms, 1);
          assert.equal(api.notify, false);

          return done();
        });
      });
  });

  it('updates existing profile in the database', (done) => {
    req.post(url)
      .set('Cookie', process.env.USER_WITH_APPS_COOKIE)
      .type('form')
      .send({
        provider: 'FOOBAR',
        name: 'Foo Bar',
        email: 'foo@bar.com',
        phone: '99988777',
        terms: '1',
      })
      .expect('x-app-status', 'success')
      .expect(303)
      .end(err => {
        if (err) { return done(err); }

        const query = { 'owner.userName': process.env.USER_WITH_APPS_OWNER };
        const proj = '';
        const opts = {};

        return ApiUser.findOne(query, proj, opts, (mongoErr, api) => {
          if (mongoErr) { return done(mongoErr); }

          assert.equal(api.provider, 'BAZ');
          assert.equal(api.contact.name, 'Foo Bar');
          assert.equal(api.contact.email, 'foo@bar.com');
          assert.equal(api.contact.phone, '99988777');
          assert.equal(api.terms, 1);
          assert.equal(api.notify, false);

          return done();
        });
      });
  });
});
