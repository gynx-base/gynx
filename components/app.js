import React, { Component } from 'react';

import { Grid, Row, Col } from 'react-bootstrap';

import * as api from '../github';
import * as lib from '../lib';

import Login from './login';
import Main from './main';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  getChats(gynx, branches) {
    return (async () => {
      const chats = await Promise.all(branches.filter(branch => /^chat-/.test(branch)).map(branch => {
        const encryptedName = atob(branch.slice('chat-'.length));
        return gynx.decrypt(JSON.parse(encryptedName));
      }));
      return chats;
    })();
  }
  handleLogin({ passphrase, token }) {
    (async () => {
      try {
        const gynx = await api.getKeys({ passphrase });

        global.gynx = gynx;

        const branches = await api.getAllBranches();
        if (branches.indexOf('keys') === -1) throw new Error('TODO: create keys branch');

        const chats = await this.getChats(gynx, branches);


        this.setState({ gynx, branches, message: '', chats });
      } catch (error) {
        const message = error.message || 'Incorrect passphrase';
        console.log(message);
        this.setState({ message });
      }
    })();
  }
  render() {
    const { passphrase, message, gynx, branches, chatSession } = this.state;

    const propsToPass = { ...this.state };

    let Content;
    if (gynx) {
      Content = Main;
      propsToPass.gynx = gynx;
      propsToPass.branches = branches;
      console.log(chatSession)
      propsToPass.isInChatSession = !!chatSession;
      propsToPass.onMessage = message => {
        (async () => {
          const encrypted = await chatSession.encrypt(message);
          console.log('sending', encrypted);
        })();
      };
      propsToPass.createNewChat = async username => {
        const publicKey = await api.getPublicKey(username);

      }
      propsToPass.handleExistingChat = async username => {
        const publicKey = await api.getPublicKey(username);
        const chatSession = await gynx.createChatSession(publicKey);
        const encryptedMessages = api.getChat(username);
        const messages = [];
        for (let encryptedMessage of encryptedMessages) {
          let message = await chatSession.decrypt(encryptedMessage);
          message.push(message);
        }
        this.setState({ chatSession, messages });
      };
    } else {
      Content = Login;
      propsToPass.showTokenInput = !localStorage.gynxToken;
      propsToPass.handleLogin = ({ passphrase, token }) => {
        this.setState({ message: 'loading...' });
        if (token) localStorage.gynxToken = token;
        this.handleLogin({ passphrase, token });
      }
    }

    return (
      <Grid>
        <Row><Col md={12}>{message}</Col></Row>
        <Row>
          <Col md={12}>
            <Content {...propsToPass} />
          </Col>
        </Row>
      </Grid>

    );
  }
}
