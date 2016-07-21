'use strict';

const assert = require('assert');
const ApiUser = require('../../apps/app/model').ApiUser;

let api;

beforeEach(() => {
  api = new ApiUser();
});

describe.only('appSchema', () => {
  describe('slugg', () => {
    it('returns URL safe slug for simple name', () => {
      const app = api.apps.create({ name: 'My App', desc: 'bar' });

      assert.equal(app.slugg, 'my-app');
    });

    it('returns URL safe slug for complex name', () => {
      const app = api.apps.create({ name: 'My Awesome App $%#', desc: 'bar' });

      assert.equal(app.slugg, 'my-awesome-app----');
    });
  });
});
