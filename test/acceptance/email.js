'use strict';

const assert = require('assert');
const supertest = require('supertest');
const req = supertest(require('../../').app);

const ApiUser = require('../../apps/app/model').ApiUser;
const apps = require('../fixtures/apps');

describe('GET /email', () => {
  const url = '/email';

  it('redirects user to unsubscribe', done => {
    req.get(url)
      .expect(302)
      .expect('Location', '/email/unsubscribe', done);
  });
});

describe('GET /email/unsubscribe', () => {
  const url = '/email/unsubscribe';

  it('redirects authenticated user to profile', done => {
    req.get(url)
      .set('Cookie', process.env.USER_NO_APPS_COOKIE)
      .expect(302)
      .expect('Location', '/profile', done);
  });

  it('returns unsubscribe form', done => {
    req.get(url)
      .expect(200)
      .expect(/Avmelding/)
      .expect(/Meld av/, done);
  });
});

describe('POST /email/unsubscribe', () => {
  const url = '/email/unsubscribe';

  it('returns error for missing email', done => {
    req.post(url)
      .type('form')
      .expect(303)
      .expect('x-app-status', 'failure')
      .expect('x-app-message', 'empty_email')
      .expect('Location', '/email/unsubscribe', done);
  });

  it('unsubscribes existing API user', done => {
    req.post(url)
      .type('form')
      .send({ email: apps[2].contact.email })
      .expect(303)
      .expect('Location', '/email/unsubscribed')
      .end(err => {
        assert.ifError(err);

        ApiUser.findOne({ _id: apps[2]._id }, (findErr, user) => {
          assert.ifError(findErr);
          assert.equal(user.notify, false);
          done();
        });
      });
  });

  it('unsubscribes unsubscribed API user', done => {
    req.post(url)
      .type('form')
      .send({ email: apps[3].contact.email })
      .expect(303)
      .expect('Location', '/email/unsubscribed')
      .end(err => {
        assert.ifError(err);

        ApiUser.findOne({ _id: apps[3]._id }, (findErr, user) => {
          assert.ifError(findErr);
          assert.equal(user.notify, false);
          done();
        });
      });
  });

  it('unsubscribes non-existing API user', done => {
    const id = '999999999999999999999999';
    const email = 'notfound@example.com';

    req.post(url)
      .type('form')
      .send({ email })
      .expect(303)
      .expect('Location', '/email/unsubscribed')
      .end(err => {
        assert.ifError(err);

        ApiUser.findOne({ _id: id }, (findErr, user) => {
          assert.ifError(findErr);
          assert.deepEqual(user, null);
          done();
        });
      });
  });
});

describe('GET /email/unsubscribed', () => {
  const url = '/email/unsubscribed';

  it('returns unsubscribed page', done => {
    req.get(url)
      .expect(200)
      .expect(/Avmeldt/)
      .expect(/Avmelding gjennomført/, done);
  });
});

describe('GET /email/unsubscribe/:id', () => {
  const url = '/email/unsubscribe';

  it('redirects user for invalid :id', done => {
    req.get(`${url}/123abc`)
      .expect(303)
      .expect('Location', '/email/unsubscribe', done);
  });

  it('unsubscribes existing API user', done => {
    req.get(`${url}/${apps[1]._id}`)
      .expect(303)
      .expect('Location', '/email/unsubscribed')
      .end(err => {
        assert.ifError(err);

        ApiUser.findOne({ _id: apps[1]._id }, (findErr, user) => {
          assert.ifError(findErr);
          assert.equal(user.notify, false);
          done();
        });
      });
  });

  it('unsubscribes unsubscribed API user', done => {
    req.get(`${url}/${apps[2]._id}`)
      .expect(303)
      .expect('Location', '/email/unsubscribed')
      .end(err => {
        assert.ifError(err);

        ApiUser.findOne({ _id: apps[2]._id }, (findErr, user) => {
          assert.ifError(findErr);
          assert.equal(user.notify, false);
          done();
        });
      });
  });

  it('unsubscribes non-existing API user', done => {
    const id = '999999999999999999999999';

    req.get(`${url}/${id}`)
      .expect(303)
      .expect('Location', '/email/unsubscribed')
      .end(err => {
        assert.ifError(err);

        ApiUser.findOne({ _id: id }, (findErr, user) => {
          assert.ifError(findErr);
          assert.deepEqual(user, null);
          done();
        });
      });
  });
});
