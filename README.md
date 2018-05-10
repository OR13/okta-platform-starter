# Okta Platform Starter

You want to use Okta for single source of truth directory with web and cli client accessing a rest api?

## Okta Setup

Make sure to register for developer preview the non production / test / demo environment.

https://developer.okta.com/

rename `example.env` to `.env`, and update its values as you complete the okta setup process.


### Create a Single Page Application

Create a new Single Page Application `Test Dashboard` in Okta, and update the client_id and issuer in `./web/src/App.js`.

Add `http://localhost:3000` to Trusted Origins under API.

Assign your okta user to `Test Dashboard`.


### Create an Admin Group

Use the okta admin ui to create some users and groups.

You should create an admin group, for your admin users, like `Acme-Admin`

API > Authorization Servers

Click scopes > add scope. Enter "groups".

Click claims > add claim. Enter "groups".

To start, use Groups instead of expression, and avoid the regex.

Thanks to picking smart group names, we can see if this user is a member of the admin group by selecting "Starts with" and "Acme".

Make sure to update your `.env` with this value so the API knows what the admin group should be.

Create a new Native Application `Test CLI` in Okta, and update the client_id and issuer in `.env`.

Make sure the Authorization server is configured to support your applications.

### Testing

If all setup is correct, you should be able to login with the dashboard web app:

```
cd web;
npm i
npm run start
```

Once you have logged in to the web app, you should see some loading messages and errors in the console, because you have not started the api server.

```
cd api
npm i
npm run start
```

Once the server is running you should see some messages for authenticated users or admins.

Finally, we want to ensure we can do the same from a CLI.

```
cd cli
npm i
npm run start login
npm run start get-requires-authentication
npm run start get-requires-admin
```

These commands simulate the same kind of network requests made by the web application.

The network requests use Bearer authentication, which passes the okta access_token as an authorization header to the api server.

The api server verifies the okta jwt from the authorization header, and attaches the decoded jwt to `req`.

This lets the express route handlers inspect the group claims, which allows for fine grained authorization based on groups in your rest api.

### Security Reminders

The `.env` file does not contain any secrets... both the web app and cli are public clients, which means that their code can safely be inspected by users, and no secrets are stored in their source. client_id is public information.

The access_token is written to a `.secrets` folder by the cli.

The access_token represents the user who authenticated with okta. This information should be protected, as anyone with access to a user jwt can impersonate that user to okta or your api.

The okta-react library stores your session in localstorage under the key `okta-token-storage`.

This means you should be careful to protect your application from XSS (you should always do this).

Because an XSS would allow an attacker to steal your users session from localstorage.

https://www.owasp.org/index.php/Test_Local_Storage_(OTG-CLIENT-012)