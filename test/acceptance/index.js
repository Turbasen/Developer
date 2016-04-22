'use strict';

const mongoose = require('mongoose');
const ApiUser = require('../../apps/app/model').ApiUser;

const mongo = require('../../lib/db');
const redis = require('../../lib/redis');
const github = require('../../lib/github');

const apps = require('../fixtures/apps');
const sessions = require('../fixtures/sessions');

module.exports.github = {};

before(() => {
  github.client = function githubClientSpy() { return module.exports.github; };
});

// Remove any pre-existing models
// Automattic/mongoose#1251
before(done => {
  mongoose.models = {};
  mongoose.modelSchemas = {};

  if (mongo.connection._hasOpened) {
    process.nextTick(done);
  } else {
    mongo.connection.once('open', done);
  }
});

// redis connect
before(done => {
  if (redis.status === 'connect') {
    done();
    return;
  }

  redis.on('ready', done);
  return;
});

// redis flush all keys
beforeEach(done => {
  redis.flushall(done);
});

// redis insert users
beforeEach(done => {
  const multi = redis.multi();

  for (const session of sessions) {
    multi.set(session.key, session.val);
  }

  multi.exec(done);
});

// mongodb connect
beforeEach(done => {
  mongo.connection.db.dropDatabase(done);
});

// mongodb indexes
beforeEach(done => {
  ApiUser.ensureIndexes(done);
});

// mongodb insert apps
beforeEach(done => {
  ApiUser.collection.collection.insert(apps, done);
});
