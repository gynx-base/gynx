import React, { Component } from 'react';

import { Grid, Row, Col, Input, ButtonInput } from 'react-bootstrap';

export default class Login extends Component {
  submit(e) {
    e.preventDefault();
    const passphrase = this.refs.passphrase.value;
    let token;
    if (!localStorage.gynxToken) {
      token = this.refs.token.value;
    }
    this.props.handleLogin({ passphrase, token });
  }
  render() {
    return (
      <div>
        <form className="form-inline" onSubmit={this.submit.bind(this)}>

          <div className="form-group">
            <label htmlFor="passphrase" style={{paddingRight: 10}}>Passphrase</label>
            <input
              type="text"
              className="form-control"
              id="passphrase"
              ref="passphrase"
            />
          </div>

          {
            this.props.showTokenInput && <div className="form-group">
              <label htmlFor="token" style={{margin: 10}}>Token</label>
              <input
                type="text"
                className="form-control"
                id="token"
                ref="token"
              />
            </div>
          }

          <button type="submit" className="btn btn-default">Go</button>
        </form>
      </div>
    );

  }
}
