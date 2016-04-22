'use strict';

const sessions = require('../fixtures/sessions');
const users = require('../fixtures/users');

process.env.NODE_ENV = 'test';
process.env.MONGO_DB = 'test';
delete process.env.MONGO_URI;

process.env.APP_ADMINS = 'Foo,Bar';
process.env.APP_SECRET = 'foobar';

process.env.USER_NO_PROFILE_COOKIE = sessions[0].cookie;
process.env.USER_NO_PROFILE_OWNER = users[0].userName;

process.env.USER_INVALID_PROFILE_COOKIE = sessions[1].cookie;
process.env.USER_INVALID_PROFILE_OWNER = users[1].userName;

process.env.USER_WITH_APPS_COOKIE = sessions[2].cookie;
process.env.USER_WITH_APPS_OWNER = users[2].userName;

process.env.USER_NO_APPS_COOKIE = sessions[3].cookie;
process.env.USER_NO_APPS_OWNER = users[3].userName;
