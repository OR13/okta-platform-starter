import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Security, ImplicitCallback } from '@okta/okta-react';
import Home from './Home';

import { OKTA_JWT_ISSUER, OKTA_JWT_CLIENT_ID } from './config.json';

const config = {
  issuer: OKTA_JWT_ISSUER,
  redirect_uri: window.location.origin + '/implicit/callback',
  client_id: OKTA_JWT_CLIENT_ID
};

class App extends Component {
  render() {
    return (
      <Router>
        <Security
          issuer={config.issuer}
          client_id={config.client_id}
          redirect_uri={config.redirect_uri}
        >
          <Route path="/" exact={true} component={Home} />
          <Route path="/implicit/callback" component={ImplicitCallback} />
        </Security>
      </Router>
    );
  }
}

export default App;
