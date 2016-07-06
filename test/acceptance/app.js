/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
'use strict';

const assert = require('assert');
const supertest = require('supertest');
const req = supertest(require('../../').app);

const ApiUser = require('../../apps/app/model').ApiUser;

describe('GET /app', () => {
  const url = '/app';

  it('redirects unauthenticated user to login', done => {
    req.get(url)
      .expect(302)
      .expect('Location', '/login', done);
  });

  it('redirects new user to profile registration', done => {
    req.get(url)
      .set('Cookie', process.env.USER_NO_PROFILE_COOKIE)
      .expect(302)
      .expect('Location', '/profile', done);
  });

  it('redirects user with missing information to profile', done => {
    req.get(url)
      .set('Cookie', process.env.USER_INVALID_PROFILE_COOKIE)
      .expect(302)
      .expect('Location', '/profile', done);
  });

  it('returns app index for existing user', done => {
    req.get(url)
      .set('Cookie', process.env.USER_WITH_APPS_COOKIE)
      .expect(200, done);
  });
});

describe('GET /app', () => {
  const url = '/app';

  it('redirects to new app for user without apps', (done) => {
    req.get(url)
      .set('Cookie', process.env.USER_NO_APPS_COOKIE)
      .expect(302)
      .expect('Location', '/app/new', done);
  });

  it('returns list of API keys', (done) => {
    req.get(url)
      .set('Cookie', process.env.USER_WITH_APPS_COOKIE)
      .expect(200)
      .expect(/Bar App 1/)
      .expect(/Bar App 2/)
      .end(done);
  });
});


describe('POST /app/:id', () => {
  const _id = '200000000000000000000001';
  const url = `/app/${_id}`;

  let data;

  beforeEach(() => {
    data = {
      name: 'Foo App',
      url: 'http://foo.app',
      desc: 'The Foo App',
      limit_prod: 5000,
      limit_dev: 500,
    };
  });

  it('returns error for non-existing app id', done => {
    req.post(`${url}NOTFOUND`)
      .set('Cookie', process.env.USER_WITH_APPS_COOKIE)
      .expect(303)
      .expect('location', '/app')
      .expect('x-app-status', 'failure')
      .expect('x-app-message', 'app_not_found', done);
  });

  it.skip('returns error for non-owner app id');

  it('returns error for missing app name', done => {
    delete data.name;

    req.post(url)
      .set('Cookie', process.env.USER_WITH_APPS_COOKIE)
      .send(data)
      .expect(303)
      .expect('location', '/app')
      .expect('x-app-status', 'failure')
      .expect('x-app-message', 'validation_error', done);
  });

  it('returns error for missing app desc', done => {
    delete data.desc;

    req.post(url)
      .set('Cookie', process.env.USER_WITH_APPS_COOKIE)
      .send(data)
      .expect(303)
      .expect('location', '/app')
      .expect('x-app-status', 'failure')
      .expect('x-app-message', 'validation_error', done);
  });

  it('saves valid app details to database', done => {
    req.post(url)
      .set('Cookie', process.env.USER_WITH_APPS_COOKIE)
      .send(data)
      .expect(303)
      .expect('location', '/app')
      .expect('x-app-status', 'success')
      .end(err => {
        if (err) { return done(err); }

        return ApiUser.findOne({ 'apps._id': _id }, (findErr, doc) => {
          if (findErr) { return done(findErr); }

          const app = JSON.parse(JSON.stringify(doc.apps.id(_id)));

          assert.deepEqual(app, {
            _id,
            name: data.name,
            desc: data.desc,
            url: data.url,
            limit: {
              prod: data.limit_prod,
              dev: data.limit_dev,
            },
            key: {
              prod: 'barkey1',
              dev: 'barkey2',
            },
            approved: true,
            active: false,
          });

          return done();
        });
      });
  });

  it('saves new rate limits as request', done => {
    data.limit_prod = 111;
    data.limit_dev = 222;

    req.post(url)
      .set('Cookie', process.env.USER_WITH_APPS_COOKIE)
      .send(data)
      .expect(303)
      .expect('location', '/app')
      .expect('x-app-status', 'success')
      .end(err => {
        if (err) { return done(err); }

        return ApiUser.findOne({ 'apps._id': _id }, (findErr, doc) => {
          if (findErr) { return done(findErr); }

          const app = JSON.parse(JSON.stringify(doc.apps.id(_id)));

          assert.deepEqual(app.limit, {
            prod: app.limit.prod,
            prodRequest: data.limit_prod,
            dev: app.limit.dev,
            devRequest: data.limit_dev,
          });

          return done();
        });
      });
  });
});

describe('POST /app/:id/disable', () => {
  const _id = '200000000000000000000002';
  const url = `/app/${_id}/disable`;

  it('disables app', done => {
    req.post(url)
      .set('Cookie', process.env.USER_WITH_APPS_COOKIE)
      .expect(303)
      .expect('location', '/app')
      .expect('x-app-status', 'success')
      .end(err => {
        if (err) { return done(err); }

        return ApiUser.findOne({ 'apps._id': _id }, (findErr, doc) => {
          if (findErr) { return done(findErr); }

          const app = JSON.parse(JSON.stringify(doc.apps.id(_id)));

          assert.equal(app.active, false);
          return done();
        });
      });
  });
});

describe('GET /app/new', () => {
  const url = '/app/new';

  it('returns new app form', done => {
    req.get(url)
      .set('Cookie', process.env.USER_NO_APPS_COOKIE)
      .expect(200)
      .expect(/Registrer ny applikasjon/, done);
  });

  it('warns about app approval limit', done => {
    req.get(url)
      .set('Cookie', process.env.USER_WITH_APPS_COOKIE)
      .expect(200)
      .expect(/Godkjenning kreves/, done);
  });
});

describe('POST /app/new', () => {
  const url = '/app/new';
  let data;

  beforeEach(() => {
    data = {
      name: 'Foo App',
      url: 'https://foo.app',
      desc: 'The Foo Application',
    };
  });

  it('returns error for missing app name', done => {
    delete data.name;

    req.post(url)
      .set('Cookie', process.env.USER_NO_APPS_COOKIE)
      .send(data)
      .expect(303)
      .expect('location', url)
      .expect('x-app-status', 'failure')
      .expect('x-app-message', 'validation_error', done);
  });

  it('returns error for missing app desc', done => {
    delete data.desc;

    req.post(url)
      .set('Cookie', process.env.USER_NO_APPS_COOKIE)
      .send(data)
      .expect(303)
      .expect('location', url)
      .expect('x-app-status', 'failure')
      .expect('x-app-message', 'validation_error', done);
  });

  it('saves first app as approved true', done => {
    req.post(url)
      .set('Cookie', process.env.USER_NO_APPS_COOKIE)
      .send(data)
      .expect(303)
      .expect('location', '/app')
      .expect('x-app-status', 'success')
      .end(err => {
        if (err) { return done(err); }

        const query = { 'owner.userName': process.env.USER_NO_APPS_OWNER };
        const proj = '';
        const opts = {};

        return ApiUser.findOne(query, proj, opts, (mongoErr, api) => {
          if (mongoErr) { return done(mongoErr); }

          const apps = JSON.parse(JSON.stringify(api.apps));

          assert.deepEqual(apps, [{
            _id: apps[0]._id,
            name: 'Foo App',
            url: 'https://foo.app',
            desc: 'The Foo Application',
            key: {
              prod: apps[0].key.prod,
              dev: apps[0].key.dev,
            },
            limit: {
              prod: 5000,
              dev: 500,
            },
            active: true,
            approved: true,
          }]);

          return done();
        });
      });
  });

  it('saves subsequent apps as approved false', done => {
    req.post(url)
      .set('Cookie', process.env.USER_WITH_APPS_COOKIE)
      .send(data)
      .expect(303)
      .expect('location', '/app')
      .expect('x-app-status', 'success')
      .end(err => {
        if (err) { return done(err); }

        const query = { 'owner.userName': process.env.USER_WITH_APPS_OWNER };
        const proj = '';
        const opts = {};

        return ApiUser.findOne(query, proj, opts, (mongoErr, api) => {
          if (mongoErr) { return done(mongoErr); }

          const app = api.apps.pop();

          assert.equal(app.active, false);
          assert.equal(app.approved, false);

          return done();
        });
      });
  });
});
