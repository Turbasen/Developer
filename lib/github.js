'use strict';

const Client = require('github');

exports.client = function githubClient(user) {
  const client = new Client({
    version: '3.0.0',
    debug: process.env.GITHUB_DEBUG === 'true',
  });

  client.authenticate({
    type: 'oauth',
    token: user.accessToken,
  });

  client.apiUser = user;

  return client;
};
