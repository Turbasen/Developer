'use strict';

const assert = require('assert');
const ApiUser = require('../../apps/app/model').ApiUser;

let api;

beforeEach(done => {
  ApiUser.findOne({ provider: 'FOO' }).then(user => {
    api = user;
    done();
  }).catch(done);
});

describe('appSchema', () => {
  describe('slugg', () => {
    it('returns URL safe slug for simple name', () => {
      const app = api.apps.create({ name: 'My App' });
      assert.equal(app.slugg, 'my-app');
    });

    it('returns URL safe slug for complex name', () => {
      const app = api.apps.create({ name: 'My Awesome App $%#' });
      assert.equal(app.slugg, 'my-awesome-app----');
    });
  });

  describe('slackAttachment()', () => {
    it('returns app as Slack attachment', () => {
      assert.deepEqual(api.apps[0].slackAttachment(), {
        author_name: 'Foo Bar (FOO)',
        title: 'Foo App',
        title_link: undefined,
        text: 'Ingen Beskrivelse',
        fallback: 'Foo App av Foo Bar (FOO). Ingen Beskrivelse ',
        color: '#2ab27b',
        fields: [{
          title: 'Epost',
          value: 'foo.bar@example.com',
          short: true,
        }, {
          title: 'Telefon',
          value: 'Ukjent',
          short: true,
        }],
      });
    });
  });

  describe('slackRequestApproval()', () => {
    it('returns Slack attachment for request approval', () => {
      assert.deepEqual(api.apps[0].slackRequestApproval(), {
        title: 'Godkjenning kreves for Foo App',
        title_link: 'https://developer.nasjonalturbase.no/admin/requests',
        text: 'Denne applikasjonen krever admin godkjenning før den blir aktiv',
        fallback: 'Denne applikasjonen krever admin godkjenning før den blir aktiv: https://developer.nasjonalturbase.no/admin/requests',
        color: '#3AA3E3',
        callback_id: 'requests/000000000000000000000000/000000000000000000000001',
        actions: [{
          name: 'approve',
          text: 'Godkjenn',
          type: 'button',
          style: 'primary',
          value: 'true',
        }, {
          name: 'approve',
          text: 'Avvis',
          type: 'button',
          value: 'false',
        }],
      });
    });
  });

  describe('slackLimitApproval()', () => {
    it('returns Slack attachment for limit approval', () => {
      assert.deepEqual(api.apps[0].slackLimitApproval(), {
        title: 'Godkjenning kreves for Foo App',
        title_link: 'https://developer.nasjonalturbase.no/admin/limits',
        text: 'Ny grense 500 (prod) og 500 (dev) krever admin godkjenning',
        fallback: 'Ny grense 500 (prod) og 500 (dev) krever admin godkjenning: https://developer.nasjonalturbase.no/admin/limits',
        color: '#3AA3E3',
        callback_id: 'limits/000000000000000000000000/000000000000000000000001',
        actions: [{
          name: 'approve',
          text: 'Godkjenn',
          type: 'bytton',
          style: 'primary',
          value: 'true',
        }, {
          name: 'approve',
          text: 'Avvis',
          type: 'button',
          value: 'false',
        }],
      });
    });
  });
});
