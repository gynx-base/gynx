import React, { Component } from 'react';

import { Row, Col, Input } from 'react-bootstrap';

export default class ChatPicker extends Component {
  handleNewChat(e) {
    e.preventDefault();
    console.log('start new chat with ', this.refs.new.getValue());
  }
  handleExistingChat(e) {
    e && e.preventDefault();
    const username = this.refs.exising.getValue();
    this.props.handleExistingChat(username);
    console.log('resume chat with ', this.refs.exising.getValue());
  }
  componentDidMount() {
    if (this.refs.exising.getValue()) {
      this.handleExistingChat();
    }
  }
  render() {
    const { chats, handleNewChat, handleExistingChat } = this.props;
    const hasChats = chats;
    return (
      <Row>
        {
          hasChats && (
            <Col md={6}>
              <Input ref="exising" type="select" label="Existing Chats" placeholder="select" onChange={e => this.handleExistingChat(e)}>
                {
                  chats.map(chat => <option key={chat} value={chat}>{chat}</option>)
                }
              </Input>
            </Col>
          )
        }
        <Col md={hasChats ? 6 : 12}>
          <form onSubmit={e => this.handleNewChat(e)}>
            <Input ref="new" type="text" label="New Chat" placeholder="New chat..." />
          </form>
        </Col>
      </Row>
    );
  }
}
