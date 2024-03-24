/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
// import * as functions from 'firebase-functions';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import admin = require('firebase-admin');
// import axios from 'axios';

const secrets = new SecretManagerServiceClient();

//'https://api-user.integrations.ecimanufacturing.com:443/oauth2/api-user/token',
// const http = axios.create({
//   baseURL: 'https://api-user.integrations.ecimanufacturing.com:443/oauth2',
// });

admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

async function getSecretValue(name: string) {
  const [version] = await secrets.accessSecretVersion({
    name: `projects/973241811935/secrets/${name}/versions/latest`,
  });
  const payload = version.payload?.data?.toString();
  return payload;
}

function validateHeader(request: any) {
  if (
    request.headers.authorization &&
    request.headers.authorization.startsWith('Bearer ')
  ) {
    return request.headers.authorization.split('Bearer ')[1];
  } else {
    logger.info('no token found' + request.headers.Authorization);
  }
}

function decodeAuthToken(authToken: any) {
  return admin
    .auth()
    .verifyIdToken(authToken)
    .then((decodeAuthToken) => {
      return decodeAuthToken.uid;
    })
    .catch((error) => {
      logger.error('unable to verify ' + error);
      return '';
    });
}

export const eci = onRequest({ cors: true }, async (request, response) => {
  response.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
    'Access-Control-Allow-Headers':
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  });
  if (request.method === 'OPTIONS') {
    logger.info('send options response');
    response.sendStatus(200);
    return;
  }
  const authToken = validateHeader(request);
  if (!authToken) {
    response.status(403).send('Unauthorized, missing');
  } else {
    const dca = await decodeAuthToken(authToken);
    if (dca) {
      let cli = await getSecretValue('eciClient');
      let sec = await getSecretValue('eciSecret');

      fetch(
        'https://api-user.integrations.ecimanufacturing.com:443/oauth2/api-user/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: cli,
            client_secret: sec,
            scope: 'openid',
            grant_type: 'client_credentials',
          }),
        }
      )
        .then((res) => {
          if (res.status === 200) {
            return res.json();
          } else {
            return { error: 'invalid status from vendor' };
          }
        })
        .then((json) => {
          response.json({ data: json }).status(200).send();
          response.end();
          //   response.status(200).send({ json });
          return;
        })
        .catch((err) => {
          logger.error('throwing an error, ' + err);
          response.status(500).send('error sending to vendor ' + err);
          return;
        });
    } else {
      response.status(403).send('Unauthorized');
    }
  }
});
