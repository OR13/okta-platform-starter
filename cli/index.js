const vorpal = require('vorpal')();
const crypto = require('crypto');
const http = require('http');
const URL = require('url-parse');
const formurlencoded = require('form-urlencoded');
const request = require('request');
const dotenv = require('dotenv');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

if (process.env.NODE_ENV === 'TEST') {
  dotenv.config({ path: '../.env' });
}

vorpal.command('version', 'display version').action((args, callback) => {
  const version = require('./package.json').version;
  console.log(JSON.stringify({ version }, null, 2));
  callback();
});

vorpal.command('login', 'login via PKCE').action(async args => {
  const config = {
    okta_host: process.env.OKTA_BASE_URL.replace('https://', ''),
    audience: process.env.OKTA_AUDIENCE,
    client_id: process.env.CLI_OKTA_CLIENT_ID,
    redirect_uri: process.env.CLI_OKTA_REDIRECT_URI
  };

  function base64URLEncode(str) {
    return str
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  function sha256(buffer) {
    return crypto
      .createHash('sha256')
      .update(buffer)
      .digest();
  }

  const { okta_host, redirect_uri, client_id } = config;
  const code_verifier = base64URLEncode(crypto.randomBytes(32));
  const code_challenge = base64URLEncode(sha256(code_verifier));
  const state_entropy = base64URLEncode(crypto.randomBytes(32));

  const url = `https://${okta_host}/oauth2/default/v1/authorize?client_id=${client_id}&response_type=code&scope=openid&redirect_uri=${redirect_uri}&state=state-${state_entropy}&code_challenge_method=S256&code_challenge=${code_challenge}`;
  console.log();
  console.log(url, '\n');

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, true);
      const { code, state } = url.query;
      if (state && state === 'state-' + state_entropy) {
        request(
          {
            method: 'POST',
            url: `https://${config.okta_host}/oauth2/default/v1/token`,
            headers: {
              accept: 'application/json',
              'cache-control': 'no-cache',
              'content-type': 'application/x-www-form-urlencoded'
            },
            body: formurlencoded({
              grant_type: 'authorization_code',
              client_id: config.client_id,
              code_verifier: code_verifier,
              code: code,
              redirect_uri: config.redirect_uri
            })
          },
          async function(error, resp, body) {
            if (error) {
              res.end(JSON.stringify(err));
              reject(err);
            } else {
              res.end('login success.');
              console.log(JSON.stringify({ success: true }, null, 2));
              await fs.writeFileAsync('../.secrets/session.json', body);
              resolve(JSON.parse(body));
            }
          }
        );
      }
    });
    server.listen(process.env.CLI_OKTA_REDIRECT_URI_PORT, err => {
      if (err) {
        return console.log('Something bad happened', err);
        reject(err);
      }
      console.log(
        `server is listening on ${
          process.env.CLI_OKTA_REDIRECT_URI_PORT
        } for okta callback.`
      );
    });
  });
});

vorpal
  .command('get-requires-authentication', 'make a request with a bearer token')
  .action((args, callback) => {
    const TOKEN = require('../.secrets/session.json').access_token;
    request(
      {
        method: 'GET',
        url:
          process.env.API_BASE_URL + `/api/v0/requires-authentication`,
        headers: {
          accept: 'application/json',
          Authorization: 'Bearer ' + TOKEN
        }
      },
      async function(error, resp, body) {
        if (error) {
          console.log(error);
        } else {
          console.log(body);
          callback();
        }
      }
    );
  });

vorpal
  .command('get-requires-admin', 'make a request with a bearer token')
  .action((args, callback) => {
    const TOKEN = require('../.secrets/session.json').access_token;
    request(
      {
        method: 'GET',
        url: process.env.API_BASE_URL + `/api/v0/requires-admin`,
        headers: {
          accept: 'application/json',
          Authorization:
            'Bearer ' + TOKEN
        }
      },
      async function(error, resp, body) {
        if (error) {
          console.log(error);
        } else {
          console.log(body);
          callback();
        }
      }
    );
  });

vorpal.parse(process.argv).delimiter('🗡️   $');
