const crypto = global.crypto.subtle;

const ecDescription = { name: 'ECDH', namedCurve: 'P-521' };

const uInt8ArrayToHexString = uint8Array => {
  return Array.from(uint8Array).map(x => ('0' + x.toString(16)).slice(-2)).join('');
};
const hexStringToUint8Array = hexString => {
  return new Uint8Array(hexString.match(/../g).map(hex => parseInt(hex, 16)));
}
const getRandomUint8Array = (length = 16) => global.crypto.getRandomValues(new Uint8Array(length));

const getPassphrase = async () => 'super strong passphrase';

const generateAESKeyFromPBKDF = async pbkdfKey => {
  const salt = getRandomUint8Array();
  const AESKey = await deriveAESKeyFromPBKDF({pbkdfKey, salt});
  return { salt, AESKey };
}

const generateKeys = async(passphrase) => {
  const { privateKey, publicKey } = await generateECKeyPair();

  const pbkdfKey = await generatePBKDF(passphrase);
  const AESKeyForPrivateKey = await generateAESKeyFromPBKDF(pbkdfKey);
  const AESKeyForNonSharedThings = await generateAESKeyFromPBKDF(pbkdfKey);
  const encryptedPrivateKey = await encryptPrivateKey({ privateKey, AESKey: AESKeyForPrivateKey.AESKey });
  encryptedPrivateKey.SaltForAESKeyForPrivateKey = uInt8ArrayToHexString(AESKeyForPrivateKey.salt);
  encryptedPrivateKey.SaltForAESKeyForNonSharedThings = uInt8ArrayToHexString(AESKeyForNonSharedThings.salt);
  console.log(await exportKey(privateKey))
  // console.log(await decryptPrivateKeys({encryptedPrivateKey, passphrase}))
  return { privateKey, encryptedPrivateKey, publicKey, AESKey: AESKeyForNonSharedThings.AESKey };
};

const encryptStringWithPBKDFBasedAESKey = async ({ AESKey, text }) => {
  const buffer = new TextEncoder('utf-8').encode(text);
  const iv = getRandomUint8Array();
  const encryptedArrayBuffer = await crypto.encrypt({name: 'AES-GCM', iv}, AESKey, buffer);
  const encryptedUint8Array = new Uint8Array(encryptedArrayBuffer);
  const enc = uInt8ArrayToHexString(encryptedUint8Array);
  const type = 'PBKDF';
  return { type, enc, iv: uInt8ArrayToHexString(iv) };
};

const encryptPrivateKey = async ({ privateKey, AESKey }) => {
  const jwk = await exportKey(privateKey);
  const jwkJson = JSON.stringify(jwk);
  const encrypted = await encryptStringWithPBKDFBasedAESKey({AESKey, text: jwkJson});
  return encrypted;
}

const decryptStringWithPBKDFBasedAESKey = async ({ AESKey, encrypted }) => {
  const iv = hexStringToUint8Array(encrypted.iv);
  const encryptedUint8Array = hexStringToUint8Array(encrypted.enc);
  const decryptedBuffer = await crypto.decrypt({ name: 'AES-GCM', iv }, AESKey, encryptedUint8Array.buffer);
  const decryptedUint8Array = new Uint8Array(decryptedBuffer);
  const text = String.fromCharCode(...decryptedUint8Array);
  return text;
};

const decryptPrivateKeys = async({ pbkdfKey, encryptedPrivateKey }) => {
  const { SaltForAESKeyForPrivateKey, SaltForAESKeyForNonSharedThings } = encryptedPrivateKey;
  const AESKeyForPrivateKey = await deriveAESKeyFromPBKDF({pbkdfKey, salt: hexStringToUint8Array(SaltForAESKeyForPrivateKey)});
  const AESKeyForNonSharedThings = await deriveAESKeyFromPBKDF({pbkdfKey, salt: hexStringToUint8Array(SaltForAESKeyForNonSharedThings)});
  const jwkJson = await decryptStringWithPBKDFBasedAESKey({ AESKey: AESKeyForPrivateKey, encrypted: encryptedPrivateKey });
  const jwk = JSON.parse(jwkJson);
  const privateKey = await crypto.importKey('jwk', jwk, ecDescription, false, ['deriveKey', 'deriveBits']);
  return { privateKey, AESKey: AESKeyForNonSharedThings };
}

const generateECKeyPair = async () => {
  return await crypto.generateKey(
    ecDescription,
    true,
    ['deriveKey', 'deriveBits'],
  );
};

const exportKey = async key => await crypto.exportKey('jwk', key);
const importPublicKey = async jwk => {
  const key = await crypto.importKey('jwk', jwk, ecDescription, false, []);
  return key;
}

const generatePBKDF = async passphrase => {
  const passphraseBuffer = new TextEncoder('utf-8').encode(passphrase);
  return await crypto.importKey('raw', passphraseBuffer, { name: 'PBKDF2' }, true, ['deriveKey']);
}

const deriveAESKeyFromPBKDF = async ({pbkdfKey, salt}) => {
  const deriveKeyOptions = {
    name: 'PBKDF2',
    salt,
    iterations: 1000000,
    hash: {name: 'SHA-256'},
  };
  return await crypto.deriveKey(deriveKeyOptions, pbkdfKey, {name: 'AES-GCM', length: 256}, true, ['encrypt', 'decrypt']);
}

const deriveSharedBits = async ({publicKey, privateKey}) => {
  const sharedBits = await crypto.deriveBits(
    {...ecDescription, public: publicKey},
    privateKey,
    256
  );
  return sharedBits;
};

const deriveSharedKDF = async derivedBits => {
  const key = await crypto.importKey('raw', derivedBits, { name: 'HKDF' }, false, ['deriveKey', 'deriveBits']);
  return key;
}

const deriveSharedAESKey = async ({ sharedKDF, salt: salt = getRandomUint8Array() }) => {
  const info = new Uint8Array([]);
  const hash = { name: 'SHA-256' };
  // console.log(sharedKDF)
  const AESKey = await crypto.deriveKey(
    { name: 'HKDF', salt, info, hash },
    sharedKDF,
    {name: 'AES-GCM', length: 256},
    true,
    ['encrypt', 'decrypt']
  );
  return { AESKey, salt };
}

const encryptStringWithHKDF = async ({ sharedKDF, text }) => {
  const { AESKey, salt } = await deriveSharedAESKey({sharedKDF});
  const iv = getRandomUint8Array();
  const buffer = new TextEncoder('utf-8').encode(text);
  const encryptedBuffer = await crypto.encrypt({name: 'AES-GCM', iv}, AESKey, buffer);
  const encryptedUint8Array = new Uint8Array(encryptedBuffer);
  const enc = uInt8ArrayToHexString(encryptedUint8Array);
  const type = 'HKDF';
  return { type, enc, iv: uInt8ArrayToHexString(iv), salt: uInt8ArrayToHexString(salt) };
}

const decryptStringWithHKDF = async ({ sharedKDF, encrypted }) => {
  const salt = hexStringToUint8Array(encrypted.salt);
  const iv = hexStringToUint8Array(encrypted.iv);
  const enc = hexStringToUint8Array(encrypted.enc);
  const { AESKey } = await deriveSharedAESKey({ sharedKDF, salt });
  const decryptedBuffer = await crypto.decrypt({ name: 'AES-GCM', iv }, AESKey, enc);
  const decryptedUint8Array = new Uint8Array(decryptedBuffer);
  const str = String.fromCharCode(...decryptedUint8Array);
  return str;
};

export const create = async ({ passphrase, encryptedPrivateKey, publicKey: publicKey = null }) => {
  if (!encryptedPrivateKey) {
    const keys = await generateKeys(passphrase);
    const publicKey = await exportKey(keys.publicKey);
    return factory({ ...keys, publicKey });
  } else {
    const pbkdfKey = await generatePBKDF(passphrase);
    const keys = await decryptPrivateKeys({ pbkdfKey, encryptedPrivateKey })
    return factory({ publicKey, pbkdfKey, ...keys });
  }
};

const factory = async ({ publicKey, privateKey, encryptedPrivateKey, AESKey }) => {
  return {
    ...(publicKey ? { publicKey } : null),
    ...(encryptedPrivateKey ? { encryptedPrivateKey } : null),
    createChatSession: async publicKeyJwk => {
      const publicKey = await importPublicKey(publicKeyJwk);
      const sharedBits = await deriveSharedBits({ publicKey, privateKey });
      const sharedKDF = await deriveSharedKDF(sharedBits);
      return {
        encrypt: async text => {
          const encrypted = await encryptStringWithHKDF({ sharedKDF, text });
          return encrypted;
        },
        decrypt: async encrypted => {
          const text = await decryptStringWithHKDF({ sharedKDF, encrypted });
          return text;
        },
      };
    },
    encrypt: async text => {
      return await encryptStringWithPBKDFBasedAESKey({ AESKey, text });
    },
    decrypt: async encrypted => {
      return await decryptStringWithPBKDFBasedAESKey({ AESKey, encrypted });
    },
  };
}

