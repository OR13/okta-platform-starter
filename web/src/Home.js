// src/Home.js

import React, { Component } from 'react';
import { withAuth } from '@okta/okta-react';

import ProtectedResourcePre from './ProtectedResourcePre';

const { PLATFORM_API_BASE_URL } = require('./config.json');

export default withAuth(
  class Home extends Component {
    constructor(props) {
      super(props);
      this.state = { authenticated: null };
      this.checkAuthentication = this.checkAuthentication.bind(this);
      this.checkAuthentication();
      this.login = this.login.bind(this);
      this.logout = this.logout.bind(this);
    }

    async checkAuthentication() {
      const authenticated = await this.props.auth.isAuthenticated();
      if (authenticated !== this.state.authenticated) {
        const user = await this.props.auth.getUser();
        this.setState({ authenticated, user });
      }
    }

    componentDidUpdate() {
      this.checkAuthentication();
    }

    login = async () => {
      this.props.auth.login('/');
    };

    logout = async () => {
      this.props.auth.logout('/');
    };

    render() {
      if (this.state.authenticated === null) return null;
      const ActionButton = () => {
        return this.state.authenticated ? (
          <button onClick={this.logout}>Logout</button>
        ) : (
          <button onClick={this.login}>Login</button>
        );
      };
      return (
        <div>
          Hello, {(this.state.user && this.state.user.name) || 'Anon'}
          <br />
          <ProtectedResourcePre
            url={PLATFORM_API_BASE_URL + '/api/v0/requires-authentication'}
          />
          <ProtectedResourcePre
            url={PLATFORM_API_BASE_URL + '/api/v0/requires-admin'}
          />
          <ActionButton />
        </div>
      );
    }
  }
);
