import * as lib from './lib';

global.token = '457c725753bfc243e887fa4f3380972ad76d3cf7';
global.token = localStorage.gynxToken;
// const username = /^(.+)\.github\.io$/.exec(location.hostname)[1];
global.username = localStorage.username;
const gynx = 'gynx';

const baseUrl = 'https://api.github.com';

const makeRawApiMethod = (method, url, body) => {
  return fetch(baseUrl + url, {
    method,
    headers: { Authorization: 'token ' + token },
    ...(body && {body: JSON.stringify(body)})
  });
}

const makeApiMethod = method => (...args) => {
  return makeRawApiMethod(method, ...args).then(response => response.json());
}

export const get = makeApiMethod('GET');
export const post = makeApiMethod('POST');
export const put = makeApiMethod('PUT');
export const patch = makeApiMethod('PATCH');

export const getFile = async ({ owner, path, branch }) => {
  debugger;
  const url = `/repos/${owner}/${gynx}/contents/${path}?ref=${branch}`;
  console.log(url);
  const file = await get(url).then(json => atob(json.content));
}

export const getPublicKey = async (owner = username) => {
  const publicKeyJsonString = await getFile({ owner, path: 'publickey.json', branch: 'keys' });

  return JSON.parse(publicKeyJsonString);
}

export const getKeys = async ({passphrase, owner: owner = username, repoName: repoName = gynx }) => {
  try {

    const getKeysBranchShaUrl = `/repos/${owner}/${gynx}/git/refs/heads/keys`;
    const { object: { sha } } = await get(getKeysBranchShaUrl);

    const getKeysCommit = `/repos/${owner}/${gynx}/git/trees/${sha}`;
    const { tree } = await get(getKeysCommit);

    const file = tree.find(file => file.path === 'encryptedprivatekey.json');

    if (!file) {
      console.log('could not find private key, generating new keys...');
      const gynxInstance = await lib.create({ passphrase });
      const { encryptedPrivateKey, publicKey } = gynxInstance;
      await uploadKeys({ encryptedPrivateKey, publicKey });
      return gynxInstance;
    }

    const encryptedPrivateKeyJson = `/repos/${owner}/${repoName}/contents/encryptedprivatekey.json?ref=keys`;

    const encryptedPrivateKey = await get(encryptedPrivateKeyJson)
      .then(json => atob(json.content))
      .then(JSON.parse);

    const keys = await lib.create({ passphrase, encryptedPrivateKey });
    return keys;

  } catch (e) {
    console.error(e)
    throw e;
  }
};

export const uploadKeys = async ({ encryptedPrivateKey, publicKey }) => {
  await put(`/repos/${username}/${gynx}/contents/publickey.json`, {
    path: 'publickey.json',
    message: 'added publickey',
    content: btoa(JSON.stringify(publicKey)),
    branch: 'keys',
  });
  await put(`/repos/${username}/${gynx}/contents/encryptedprivatekey.json`, {
    message: 'added encryptedPrivateKey',
    content: btoa(JSON.stringify(encryptedPrivateKey)),
    branch: 'keys',
  });
};

export const getAllBranches = async () => {
  const set = new Set();
  let url = `/repos/${username}/${gynx}/git/refs`;
  let matches = [, baseUrl + url];
  let response;
  let json;
  let link;
  do {
    url = matches[1].slice(baseUrl.length);
    response = await makeRawApiMethod('get', url);
    json = await response.json();
    json.forEach(branch => set.add(branch.ref));
    link = response.headers.get('Link');
    matches = link && link.match(/<(.*?)>; rel="next"/);
  } while (matches);

  return Array.from(set).filter(branch => /^refs\/heads\//.test(branch)).map(name => name.slice(11));

}

export const loadChatSession = async username => {
  const publicKey = await getPublicKey(username);
  console.log(publicKey);
}

export const inviteToChat = async username => {
  const issues = await get(`/repos/${username}/${gynx}/issues`);
  let inviteIssue = issues.find(issue => issue.title === 'invites');
  let issueNumber;
  if (!inviteIssue) {
    inviteIssue = await post(`/repos/${username}/${gynx}/issues`, {title: 'invites'});
  }
  issueNumber = inviteIssue.number;
  await post(`/repos/${username}/${gynx}/issues/${issueNumber}/comments`, {body: `@${username} let's chat`});
}

export const createNewChat = async username => {
  const publicKey = await getPublicKey(username);
}

