'use strict';

const assert = require('assert');
const appsort = require('../../lib/appsort');

describe('appsort', () => {
  it('sorts array alphabetically by name property', () => {
    const apps = [{ name: 'b' }, { name: 'a' }, { name: 'c' }];
    apps.sort(appsort);

    assert.deepEqual(apps, [{ name: 'a' }, { name: 'b' }, { name: 'c' }]);
  });

  it('sorts matching prefixed names correctly', () => {
    const apps = [{ name: 'aa' }, { name: 'a' }, { name: 'aaa' }];
    apps.sort(appsort);

    assert.deepEqual(apps, [{ name: 'a' }, { name: 'aa' }, { name: 'aaa' }]);
  });

  it('groups lower and upper case names together', () => {
    const apps = [{ name: 'a' }, { name: 'A' }, { name: 'b' }];
    apps.sort(appsort);

    assert.deepEqual(apps, [{ name: 'a' }, { name: 'A' }, { name: 'b' }]);
  });
});
