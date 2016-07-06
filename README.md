# Nasjonal Turbase Developer

[![Build status](https://app.wercker.com/status/5a3835c2b0aee058bc7d6a0dc3315880/s "wercker status")](https://app.wercker.com/project/bykey/5a3835c2b0aee058bc7d6a0dc3315880)
[![Codacy grade](https://img.shields.io/codacy/grade/5718986a9cf11bee121d695b.svg "Codacy grade")](https://www.codacy.com/app/Turbasen/Developer)
[![Codacy coverage](https://img.shields.io/codacy/coverage/5718986a9cf11bee121d695b.svg "Codacy coverage")](https://www.codacy.com/app/Turbasen/Developer)
[![NPM downloads](https://img.shields.io/npm/dm/@turbasen/developer.svg "NPM downloads")](https://www.npmjs.com/package/@turbasen/developer)
[![NPM version](https://img.shields.io/npm/v/@turbasen/developer.svg "NPM version")](https://www.npmjs.com/package/@turbasen/developer)
[![Node version](https://img.shields.io/node/v/@turbasen/developer.svg "Node version")](https://www.npmjs.com/package/@turbasen/developer)
[![Dependency status](https://img.shields.io/david/Turbasen/Developer.svg "Dependency status")](https://david-dm.org/Turbasen/Developer)

Developer portal for Nasjonal Turbase.

![Nasjonal Turbase Developer](https://raw.githubusercontent.com/Turbasen/Developer/master/static/images/demo.gif)

## Features

* GitHub Authentication
* Turbasen Developer Profile
* Generate API keys for Nasjonal Turbase
* Approve new API apps
* Approve rate limit changes

## Development

### Prerequisite

* Docker > 1.11
* Docker Compose > 1.7

### Environment

Put these environment variables in you `.env` file.

* `GH_OAUTH_CLIENT` - GitHub Oauth Client ID
* `GH_OAUTH_SECRET` - GitHub Oauth Client Secret
* `GH_OAUTH_RANDOM` - GitHub Oauth Client Random

### Commands

| Command         | Description                     |
|-----------------|---------------------------------|
| `npm test`      | Run test suite                  |
| `npm start`     | Run development server          |
| `npm run watch` | Run test suite when files change|
| `npm run lint`  | Run source code linter          |
| `npm run grunt` | Build static assets             |

## [MIT Licensed](https://github.com/Turbasen/Developer/blob/master/LICENSE)
