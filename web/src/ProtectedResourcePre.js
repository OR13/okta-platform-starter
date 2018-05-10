import fetch from 'isomorphic-fetch';
import React, { Component } from 'react';
import { withAuth } from '@okta/okta-react';

export default withAuth(
  class ProtectedResourcePre extends Component {
    constructor(props) {
      super(props);
      this.state = {
        data: null
      };
    }

    async componentDidMount() {
      try {
        const response = await fetch(this.props.url, {
          headers: {
            Authorization: 'Bearer ' + (await this.props.auth.getAccessToken())
          }
        });
        const data = await response.json();
        this.setState({ data });
      } catch (err) {
        // handle error as needed
      }
    }

    render() {
      if (!this.state.data) return <div>Loading..</div>;
      return <pre>{JSON.stringify(this.state.data, null, 2)} </pre>;
    }
  }
);
