/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
'use strict';

const assert = require('assert');
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

describe.only('GET /slack/action', () => {
  const url = '/slack/action';

  let payload;
  let app;
  let api;

  beforeEach((done) => {
    ApiUser.findOne({ provider: 'BAZ' }).then(user => {
      api = user;
      app = user.apps[0];
      done();
    }).catch(done);
  });

  beforeEach(() => {
    payload = {
      team: { id: 'AAA', domain: 'bbb' },
      channel: { id: 'CCC', name: 'ddd' },
      user: { id: 'EEE', name: 'fff' },
      action_ts: '1469177138.615534',
      message_ts: '1469171942.000002',
      token: process.env.SLACK_VERIFICATION_TOKEN,
      response_url: 'https://hooks.slack.com/actions/AAA/BBB/CCC',
    };
  });

  it('returns error for missing Slack token', done => {
    req.post(url)
      .type('form')
      .send({ payload: '{}' })
      .expect(401)
      .expect('Missing or invalid verification token', done);
  });

  it('returns error for invalid Slack token', done => {
    req.post(url)
      .type('form')
      .send({ payload: '{"token": "invalid"}' })
      .expect(401)
      .expect('Missing or invalid verification token', done);
  });

  it('returns error for invalid API user id', done => {
    req.post(url)
      .type('form')
      .send({
        payload: JSON.stringify({
          token: process.env.SLACK_VERIFICATION_TOKEN,
          callback_id: `request/abcdef000000000000000000/${app._id}`,
        }),
      })
      .expect(404)
      .expect('API user "abcdef000000000000000000" not found', done);
  });

  it('returns error for invalid API app id', done => {
    req.post(url)
      .type('form')
      .send({
        payload: JSON.stringify({
          token: process.env.SLACK_VERIFICATION_TOKEN,
          callback_id: 'request/000000000000000000000000/abcdef000000000000000000',
        }),
      })
      .expect(404)
      .expect('API app "abcdef000000000000000000" not found', done);
  });

  it('returns error for invalid Slack action', done => {
    req.post(url)
      .type('form')
      .send({ payload: JSON.stringify({ callback_id: 'invalid/a/b' }) })
      .expect(401)
      .expect('Missing or invalid verification token', done);
  });

  describe('request', () => {
    beforeEach(() => {
      payload.actions = [{ name: 'approve', value: 'true' }];
      payload.callback_id = `requests/${api._id}/${app._id}`;
      payload.original_message = {
        text: 'This is a test message',
        attachments: [
          app.slackAttachment(),
          app.slackRequestApproval(),
        ].map((obj, i) => { obj.id = i + 1; return obj; }),
      };
      payload.attachment_id = 2;
    });


    it('it approves request', done => {
      const message = JSON.parse(JSON.stringify(payload.original_message));
      message.attachments[1] = {
        id: 2,
        text: ':white_check_mark: @fff godkjennte denne appikasjonen',
      };

      req.post(url)
        .type('form')
        .send({ payload: JSON.stringify(payload) })
        .expect(200)
        .end(err => {
          assert.ifError(err);

          ApiUser.findOne({ _id: api._id }).then(user => {
            const app = user.apps.id(app._id);

            assert.equal(app.active, true);
            assert.equal(app.approved, true);

            done();
          }).catch(done);
        });
    });
  });
});
