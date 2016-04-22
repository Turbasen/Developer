'use strict';

module.exports = (a, b) => {
  /* eslint no-else-return: 0 */
  if (a.name.toLowerCase() < b.name.toLowerCase()) {
    return -1;
  } else if (a.name.toLowerCase() > b.name.toLowerCase()) {
    return 1;
  } else {
    return 0;
  }
};
