'use strict';

const users = require('./users');
const objectId = require('mongoose').Types.ObjectId;

module.exports = [{
  _id: objectId('000000000000000000000000'),
  provider: 'FOO',
  contact: {
    name: 'Foo Bar',
    email: 'foo.bar@example.com',
  },
  keys: {
    fookey: { limit: 500 },
  },
  apps: [{
    _id: objectId('000000000000000000000001'),
    active: true,
    name: 'Foo App',
    desc: 'Ingen Beskrivelse',
    key: {
      prod: 'fookey',
      dev: 'fookey',
    },
    limit: {
      prod: 500,
      dev: 500,
    },
  }],
  terms: 1,
}, {
  _id: objectId('100000000000000000000000'),
  provider: 'BAR',
  keys: {
    barkey: { limit: 500 },
  },
  apps: [{
    _id: objectId('100000000000000000000001'),
    active: true,
    name: 'Bar App',
    desc: 'Ingen Beskrivelse',
    key: {
      prod: 'barkey',
      dev: 'barkey',
    },
    limit: {
      prod: 500,
      dev: 500,
    },
  }],
  owner: users[1],
  updated: new Date('2016-02-29T07:30:03.755Z'),
  notify: false,
  terms: 1,
}, {
  _id: objectId('200000000000000000000000'),
  provider: 'BAZ',
  contact: {
    name: 'Bar Foo',
    email: 'bar.foo@example.com',
    phone: '+47 999 88 777',
  },
  keys: {
    barkey1: { limit: 5000 },
    barkey2: { limit: 500 },
  },
  apps: [{
    _id: objectId('200000000000000000000001'),
    active: false,
    name: 'Bar App 1',
    url: 'https://bar.com/1',
    desc: 'The Bar Application 1',
    key: {
      prod: 'barkey1',
      dev: 'barkey2',
    },
    limit: {
      prod: 5000,
      dev: 500,
    },
  }, {
    _id: objectId('200000000000000000000002'),
    active: true,
    name: 'Bar App 2',
    url: 'https://bar.com/2',
    desc: 'The Bar Application 2',
    key: {
      prod: 'barkey3',
      dev: 'barkey4',
    },
    limit: {
      prod: 5000,
      dev: 500,
    },
  }],
  owner: users[2],
  updated: new Date('2016-02-29T07:30:04.755Z'),
  notify: true,
  terms: 1,
}, {
  _id: objectId('300000000000000000000000'),
  provider: 'BEZ',
  contact: {
    name: 'Bez Biz',
    email: 'bez.biz@example.com',
    phone: '+47 55 44 33 22',
  },
  owner: users[3],
  updated: new Date('2016-02-29T07:30:05.755Z'),
  notify: false,
  terms: 1,
}];
