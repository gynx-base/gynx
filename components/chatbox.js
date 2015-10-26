import React, { Component } from 'react';

import { Row, Col, Input } from 'react-bootstrap';

export default class ChatBox extends Component {
  onMessage(e) {
    e.preventDefault();
    this.props.onMessage(this.refs.message.getValue());
  }
  render() {
    const { messages, onMessage } = this.props;
    return (
      <div>
        <div>
          { messages.map(message => <div>{message}</div>) }
        </div>
        <form onSubmit={e => this.onMessage(e)}>
          <Input ref="message" type="text" placeholder="message..." />
        </form>
      </div>
    );
  }
}
