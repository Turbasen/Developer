'use strict';

const Schema = require('../../lib/db').Schema;
const db = require('../../lib/db');

const keygen = require('../../lib/keygen');
const appsort = require('../../lib/appsort');

const github = require('../../lib/github');
const moment = require('moment');

const appSchema = new Schema({
  active: { type: Boolean, default: true },
  approved: { type: Boolean, default: true },
  rejection: { type: String },
  name: { type: String, required: 'App navn kan ikke være tomt' },
  url: {
    type: String,
    validate: {
      validator: v => /^https?:\/\//.test(v),
      message: 'URL må være en gyldig addresse',
    },
  },
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

appSchema.virtual('isActive').get(function appSchemaIsActive() {
  return !!this.active && !!this.approved;
});

appSchema.virtual('isPending').get(function appSchemaIsPending() {
  return !this.approved && !this.rejection;
});

appSchema.virtual('isRejected').get(function appSchemaIsRejected() {
  return !this.approved && !!this.rejection;
});

appSchema.virtual('slugg').get(function appSchemaVirtualSlugg() {
  return this.name.toLowerCase().replace(/[^a-zaæå0-9]/g, '-');
});

appSchema.methods.slackAttachment = function slackAttachment() {
  const author = `${this.__parent.contact.name} (${this.__parent.provider})`;

  return {
    author_name: author,
    title: this.name,
    title_link: this.url,
    text: this.desc,
    fallback: `${this.name} av ${author}. ${this.desc} ${this.url || ''}`,
    color: '#2ab27b',
    fields: [{
      title: 'Epost',
      value: this.__parent.contact.email || 'Ukjent',
      short: true,
    }, {
      title: 'Telefon',
      value: this.__parent.contact.phone || 'Ukjent',
      short: true,
    }],
  };
};

appSchema.methods.slackRequestApproval = function slackRequestApproval() {
  const text = 'Denne applikasjonen krever admin godkjenning før den blir aktiv';
  const link = 'https://developer.nasjonalturbase.no/admin/requests';

  return {
    title: `Godkjenning kreves for ${this.name}`,
    title_link: link,
    text,
    fallback: `${text}: ${link}`,
    color: '#3AA3E3',
    callback_id: `requests/${this.__parent._id}/${this._id}`,
    actions: [{
      name: 'approve',
      text: 'Godkjenn',
      type: 'button',
      style: 'primary',
      value: 'true',
    }, {
      name: 'approve',
      text: 'Avvis',
      type: 'button',
      value: 'false',
    }],
  };
};

appSchema.methods.slackLimitApproval = function slackLimitApproval() {
  const prod = this.limit.prodRequest || this.limit.prod;
  const dev = this.limit.devRequest || this.limit.dev;

  const text = `Ny grense ${prod} (prod) og ${dev} (dev) krever admin godkjenning`;
  const link = 'https://developer.nasjonalturbase.no/admin/limits';

  return {
    title: `Godkjenning kreves for ${this.name}`,
    title_link: link,
    text,
    fallback: `${text}: ${link}`,
    color: '#3AA3E3',
    callback_id: `limits/${this.__parent._id}/${this._id}`,
    actions: [{
      name: 'approve',
      text: 'Godkjenn',
      type: 'bytton',
      style: 'primary',
      value: 'true',
    }, {
      name: 'approve',
      text: 'Avvis',
      type: 'button',
      value: 'false',
    }],
  };
};

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
      message: 'Brukernavn kan bare bestå av store bokstaver og tall uten mellomrom',
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

userSchema.virtual('days').get(function appSchemaVirtualIsNew() {
  return moment(Date.now()).diff(this.updated, 'days');
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
