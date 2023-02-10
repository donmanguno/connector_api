'use strict';

const request = require('request');

/**
 * Returns CSDS Domains for an account
 * @param {string} accountId
 * @param {string} [csdsDomain='api.liveperson.net']
 * @returns {Promise<object|string>}
 */
function getDomains(accountId, csdsDomain = 'api.liveperson.net') {
    let url = `https://${csdsDomain}/api/account/${accountId}/service/baseURI.json?version=1.0`;

    return new Promise((resolve, reject) => {
        request({
            url: url,
            json: true
        }, (err, response, body) => {
            if (err) reject(`[ExternalServices.getDomains] ${err}`);
            if (response.statusCode && ~~(response.statusCode/100) !== 2) {
                reject(`[ExternalServices.getDomains] ${response.statusCode} ${response.statusMessage}`)
            }
            let domains = {};
            if (body && body.baseURIs && body.baseURIs.length) {
                for (let i = 0; i < body.baseURIs.length; i++) {
                    let uriEntry = body.baseURIs[i];
                    domains[uriEntry.service] = uriEntry.baseURI;
                }
                resolve(domains);
            }
        });
    })
}

/**
 * Obtains an APP JWT for the connector application
 * @param {string} accountId
 * @param {string} sentinelDomain
 * @param {string} installationId
 * @param {string} secret
 * @returns {Promise<object>}
 */
function getAppJWT(accountId, sentinelDomain, installationId, secret) {
    let url = `https://${sentinelDomain}/sentinel/api/account/${accountId}/app/token`;

    return new Promise((resolve, reject) => {
        request.post({
            url: url,
            qs: {
                "v": "1.0",
                "grant_type": "client_credentials",
                "client_id": installationId,
                "client_secret": secret
            },
            json: true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }, (err, response, body) => {
            if (err) reject(`[ExternalServices.getAppJWT] ${err}`);
            if (response.statusCode && ~~(response.statusCode/100) !== 2) {
                reject(`[ExternalServices.getAppJWT] ${response.statusCode} ${response.statusMessage}`)
            }
            else resolve(body);
        });
    })
}

/**
 * Returns a JWS for a specific consumer, derived from the APP JWT
 * @param {string} accountId
 * @param {string} idpDomain
 * @param {string} jwt
 * @param {string} [ext_consumer_id=(random id)]
 * @returns {Promise<object>}
 */
function getAppJWS(accountId, idpDomain, jwt, ext_consumer_id = 'random_id.'+Math.floor(Math.random()*100000000000)) {
    let url = `https://${idpDomain}/api/account/${accountId}/consumer?v=1.0`;

    return new Promise((resolve, reject) => {
        request.post({
            url: url,
            json: true,
            body: {
                'ext_consumer_id': ext_consumer_id
            },
            headers: {
                'Content-Type': 'application/json',
                'Authorization': jwt
            }
        }, (err, response, body) => {
            if (err) reject(`[ExternalServices.getAppJWS] ${err}`);
            if (response.statusCode && ~~(response.statusCode/100) !== 2) {
                reject(`[ExternalServices.getAppJWS] ${response.statusCode} ${response.statusMessage}`)
            }
            if (!body.token) reject(`[ExternalServices.getAppJWS] jws not obtained for ${ext_consumer_id}: ${JSON.stringify(body)}`);
            else {
                body.externalConsumerId = JSON.parse(response.request.body).ext_consumer_id;
                resolve(body)
            }
        })
    })
}

/**
 * Returns list of ongoing conversations for a particular consumerId
 * @param {string} accountId
 * @param {string} msgHistDomain
 * @param {string} consumerId
 * @param {string} conversationState - acceptable values are 'OPEN', 'CLOSE'
 * @param {Object<string>} oauthParams
 * @param {string} oauthParams.consumer_key
 * @param {string} oauthParams.consumer_secret
 * @param {string} oauthParams.token
 * @param {string} oauthParams.token_secret
 * @returns {Promise<any>}
 */
function conversationHistory(accountId, msgHistDomain, consumerId, conversationState, oauthParams) {
    let url = `https://${msgHistDomain}/messaging_history/api/account/${accountId}/conversations/consumer/search`,
      data = { 'consumer': consumerId, 'status': [conversationState] };

    return new Promise((resolve, reject) => {
        request.post({
            url: url,
            json: true,
            body: data,
            oauth: oauthParams
        }, (err, response) => {
            if (err) reject(`[ExternalServices.conversationHistory] ${err}`);
            if (response.statusCode && ~~(response.statusCode/100) !== 2) {
                reject(`[ExternalServices.conversationHistory] ${response.statusCode} ${response.statusMessage}`)
            }
            else resolve(response)
        })
    })
}

/**
 * Returns an agent's nickname
 * @param accountId
 * @param accdnDomain
 * @param pid
 * @returns {Promise<string>}
 */
function getAgentNickname(accountId, accdnDomain, pid) {
    let url = `https://${accdnDomain}/api/account/${accountId}/configuration/le-users/users/${pid}`;

    return new Promise((resolve, reject) => {
        request.get({
            url: url,
            json: true
        }, (err, response, body) => {
            if (err) reject(`[ExternalServices.getAgentNickname] ${err}`);
            if (response.statusCode && ~~(response.statusCode/100) !== 2) {
                reject(`[ExternalServices.getAgentNickname] ${response.statusCode} ${response.statusMessage}`)
            }
            else resolve(body && body.nickname)
        })
    })
}

module.exports = {
    getDomains,
    getAppJWT,
    getAppJWS,
    conversationHistory,
    getAgentNickname
};