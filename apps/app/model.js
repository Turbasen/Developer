'use strict';

const Schema = require('../../lib/db').Schema;
const db = require('../../lib/db');
const keygen = require('../../lib/keygen');
const appsort = require('../../lib/appsort');

const github = require('../../lib/github');

const appSchema = new Schema({
  active: { type: Boolean, default: true },
  approved: { type: Boolean, default: true },
  name: { type: String, required: 'App navn kan ikke være tomt' },
  url: String,
  desc: { type: String, required: 'App beskrivelse kan ikke være tomt' },
  key: {
    prod: { type: String, default: keygen },
    dev: { type: String, default: keygen },
  },
  limit: {
    prod: { type: Number, default: 5000 },
    prodRequest: { type: Number },
    dev: { type: Number, default: 500 },
    devRequest: { type: Number },
  },
});

appSchema.virtual('slugg').get(function appSchemaVirtualSlugg() {
  return this.name.toLowerCase().replace(/[^a-zaæå0-9]/g, '-');
});

const ownerSchema = new Schema({
  userId: Number,
  userName: String,
  email: String,
  fullName: String,
  accessToken: String,
  refreshToken: String,
  avatarUrl: String,
});

const userSchema = new Schema({
  provider: {
    type: String,
    unique: true,
    required: 'Brukernavn kan ikke være tomt',
    validate: {
      validator: v => /^[A-Z0-9]{3,}$/.test(v),
      message: 'Brukernavn må består av store bokstaver og tall',
    },
  },
  updated: { type: Date, default: Date.now },
  contact: {
    name: { type: String, required: 'Navn kan ikke være tomt' },
    email: { type: String, required: 'Epost kan ikke være tomt' },
    phone: { type: String, required: 'Telefon kan ikke være tomt' },
  },
  owner: [ownerSchema],
  keys: Object,
  apps: [appSchema],
  terms: {
    type: Number,
    required: 'Du må akseptere vilkårene',
    min: [1, 'Du må akseptere vilkårene'],
  },
  notify: { type: Boolean, default: true },
});

userSchema.set('strict', false);
userSchema.set('collection', 'api.users');
// userSchema.set('validateBeforeSave', false);

userSchema.post('init', (user) => {
  if (!user.apps || user.apps.length === 0) {
    user.apps = Object.keys(user.keys || {}).map(key => {
      const app = user.keys[key];

      return {
        active: app.deprecated !== true,
        name: app.app || 'Uten Navn',
        url: app.url,
        desc: app.desc || 'Ingen Beskrivelse',
        key: {
          prod: key,
          dev: key,
        },
        limit: {
          prod: app.limit,
          dev: 500,
        },
      };
    });

    user.apps.sort(appsort);
  }
});

// Pre Save - Last Updated
userSchema.pre('save', function preSaveUpdateDate(next) {
  this.updated = new Date();
  next();
});

// Pre Save - Sort Apps
userSchema.pre('save', function preSaveSortApps(next) {
  this.apps.sort(appsort);
  next();
});

// Pre Save - Keys Backwards Compability
userSchema.pre('save', function preSaveBackportKeys(next) {
  const keys = {};

  for (const app of this.apps) {
    if (app.active) {
      keys[app.key.dev] = {
        limit: app.limit.dev,
      };

      // make sure we overwrite existing key with the prod limit
      keys[app.key.prod] = {
        limit: app.limit.prod,
      };
    }
  }

  this.set('keys', {});
  this.set('keys', keys);

  next();
});

userSchema.methods.github = function appGithubClient() {
  return github.client(this.owner);
};

module.exports = {
  ApiUser: db.model('ApiUser', userSchema),
};
