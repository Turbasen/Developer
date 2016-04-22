'use strict';

const ApiUser = require('../apps/app/model').ApiUser;

const cursor = ApiUser.find((err, docs) => {
  if (err) { throw err; }

  for (const doc of docs) {
    for (const app of doc.apps) {
      app.name = app.name || 'Uten Navn';
      app.desc = app.desc || 'Ingen Beskrivelse';
    }

    doc.save({'validateBeforeSave': false}, err => {
      if (err) { throw err; }
      console.log(doc._id);
    });
  }
});

process.on('SIGINT', process.exit.bind(process, 1));
