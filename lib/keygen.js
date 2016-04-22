'use strict';

const crypto = require('crypto');

module.exports = () => {
  const random = crypto.randomBytes(256);
  const key = crypto.createHash('sha1').update(random).digest('hex');

  return key;
};
