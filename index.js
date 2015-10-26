import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Grid, Row, Col, Input, ButtonInput } from 'react-bootstrap';

import * as api from './github';
import * as lib from './lib';

import App from './components/app';



ReactDOM.render(
  <App />,
  document.getElementById('app')
);


global.lib = lib;
global.api = api;



// (async () => {
//   console.group('testing')
//   const user1Keys = await lib.generateKeys('hello');
//   const user2Keys = await lib.generateKeys('sup');
//   const sharedBits1 = await lib.deriveSharedBits({publicKey: user2Keys.publicKey, privateKey: user1Keys.privateKey});
//   const sharedBits2 = await lib.deriveSharedBits({publicKey: user1Keys.publicKey, privateKey: user2Keys.privateKey});
//   const sharedKDF1 = await lib.deriveSharedKDF(sharedBits1);
//   const sharedKDF2 = await lib.deriveSharedKDF(sharedBits2);
//   const AES1 = await lib.deriveSharedAESKey({deriveSharedKDF: sharedKDF1})
//   const AES2 = await lib.deriveSharedAESKey({deriveSharedKDF: sharedKDF2, salt: AES1.salt})
//   const jwk1 = await window.crypto.subtle.exportKey('jwk', AES1.AESKey);
//   const jwk2 = await window.crypto.subtle.exportKey('jwk', AES2.AESKey);
//   console.assert(JSON.stringify(jwk1) === JSON.stringify(jwk2), 'exports same jwk');
//   const message = 'this is a test' + Math.random();
//   const encryptedMessage = await lib.encryptString({ deriveSharedKDF: sharedKDF1, str: message });
//   // console.log(encryptedMessage);
//   const orignalMessage = await lib.decryptString({ deriveSharedKDF: sharedKDF2, encrypted: encryptedMessage })
//   console.assert(orignalMessage === message, 'decrypts the encrypted message');
//   console.log('tests done')
//   console.groupEnd('tests')
// })();


(async () => {
  return;
  console.group('testing')




  console.time('bootstrapping');
  const gynx1 = await lib.create({ passphrase: 'hello' });
  const gynx2 = await lib.create({ passphrase: 'sup' });
  console.timeEnd('bootstrapping');
  console.log(gynx1)
  console.time('create session');
  const session1 = await gynx1.createChatSession(gynx2.publicKey);
  const session2 = await gynx2.createChatSession(gynx1.publicKey);
  console.timeEnd('create session');
  const message = 'this is a test';

  console.time('session chat');
  const encryptedMessage = await session1.encrypt(message);
  const orignalMessage = await session2.decrypt(encryptedMessage);
  console.log('orignalMessage === message', orignalMessage === message);
  console.timeEnd('session chat');


  console.time('import keys');
  const gynx3 = await lib.create({ passphrase: 'hello' , encryptedPrivateKey: gynx1.encryptedPrivateKey });
  console.timeEnd('import keys');

  console.time('get private with gynx3')
  const privateMessage = 'this is a private message';
  const encryptedPrivateMessage = await gynx1.encrypt(privateMessage);
  const orignalPrivateMessage = await gynx3.decrypt(encryptedPrivateMessage);
  console.log('orignalPrivateMessage === privateMessage', orignalPrivateMessage === privateMessage);
  console.timeEnd('get private with gynx3')

  console.time('get chats for gynx3')
  const session3 = await gynx3.createChatSession(gynx2.publicKey);
  console.log('await session3.decrypt(encryptedMessage) === message', await session3.decrypt(encryptedMessage) === message);
  console.timeEnd('get chats for gynx3')

  console.time('should be free')
  console.assert(await gynx3.decrypt(await gynx1.encrypt(privateMessage)) === orignalPrivateMessage);
  console.assert(await gynx3.decrypt(await gynx1.encrypt(privateMessage)) === orignalPrivateMessage);
  console.assert(await gynx3.decrypt(await gynx1.encrypt(privateMessage)) === orignalPrivateMessage);
  console.assert(await gynx3.decrypt(await gynx1.encrypt(privateMessage)) === orignalPrivateMessage);
  console.assert(await gynx3.decrypt(await gynx1.encrypt(privateMessage)) === orignalPrivateMessage);
  console.assert(await gynx3.decrypt(await gynx1.encrypt(privateMessage)) === orignalPrivateMessage);
  console.assert(await gynx3.decrypt(await gynx1.encrypt(privateMessage)) === orignalPrivateMessage);
  console.timeEnd('should be free')

  console.log('tests done')
  console.groupEnd('tests')
})();
