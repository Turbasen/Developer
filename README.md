# Nasjonal Turbase Developer

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

|-----------------|---------------------------------|
| Command         | Description                     |
|-----------------|---------------------------------|
| `npm test`      | Run test suite                  |
| `npm start`     | Run development server          |
| `npm run watch` | Run test suite when files change|
| `npm run lint`  | Run source code linter          |
| `npm run grunt` | Build static assets             |
|-----------------|---------------------------------|

## [MIT Licensed](https://github.com/Turbasen/Developer/blob/master/LICENSE)
