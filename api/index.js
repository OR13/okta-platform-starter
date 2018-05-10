const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const eaa = require('express-async-await');

const dotenv = require('dotenv');

const OktaJwtVerifier = require('@okta/jwt-verifier');

if (process.env.NODE_ENV === 'TEST') {
  dotenv.config({ path: '../.env' });
}

const app = express();
const packageJson = require('./package.json');
const router = express.Router();

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.OKTA_ISSUER,
  assertClaims: { aud: process.env.OKTA_AUDIENCE }
});

/**
 * A simple middleware that asserts valid access tokens and sends 401 responses
 * if the token is not present or fails validation.  If the token is valid its
 * contents are attached to req.jwt
 */
const authenticationRequired = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/Bearer (.+)/);

  if (!match && !req.query.jwt) {
    res.status(401);
    return next('Unauthorized');
  }

  const accessToken = req.query.jwt || match[1];

  return oktaJwtVerifier
    .verifyAccessToken(accessToken)
    .then(jwt => {
      req.jwt = jwt;
      next();
    })
    .catch(err => {
      res.status(401).send(err.message);
    });
};

eaa(app);

app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use('/api/v0', router);

router.get('/', (req, res) => {
  res.json({
    version: packageJson.version
  });
});

router.get(
  '/requires-authentication',
  authenticationRequired,
  async (req, res) => {
    res.json({
      message: 'You are authenticated.'
    });
  }
);

router.get('/requires-admin', authenticationRequired, async (req, res) => {
  console.log(req.jwt.claims.groups)
  if (
    req.jwt.claims.groups &&
    req.jwt.claims.groups.indexOf(process.env.OKTA_ADMIN_GROUP) !== -1
  ) {
    res.json({
      message: 'You are an admin.'
    });
  } else {
    res.sendStatus(403);
  }
});

app.listen(process.env.API_PORT, () => {
  console.log(`Listening on ${process.env.API_PORT}`);
});

module.exports = app;
