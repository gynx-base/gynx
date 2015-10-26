import React, { Component } from 'react';

import { Row, Col } from 'react-bootstrap';

import ChatPicker from './chatpicker';
import ChatBox from './chatbox';

export default class Main extends Component {
  render() {
    const {
      chats,
      onMessage,
      messages,
      handleExistingChat,
      handleNewChat,
    } = this.props;

    return (
      <Row>
        <Col md={6}>
          <ChatPicker chats={chats} handleNewChat={handleNewChat} handleExistingChat={handleExistingChat} />
          { this.props.isInChatSession && <ChatBox messages={messages} onMessage={onMessage} /> }
        </Col>
      </Row>
    );
  }
}
