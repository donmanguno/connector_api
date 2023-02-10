'use strict';

const Events = require('eventemitter2');
const jwt_decode = require('jwt-decode');
const request = require('request');
const fs = require('fs');

const externalServices = require('./ExternalServices');

const packageJson = require('../package.json');
const USER_AGENT_HEADER = `MarkConnector/${packageJson.version}`;
const CLIENT_PROPERTIES_HEADER = {
    'type': '.ams.headers.ClientProperties',
    'appId': 'unspecified',
    'features': ['AUTO_MESSAGE'],
    'integration': packageJson.name,
    'integrationVersion': packageJson.version
};

// noinspection JSUnusedGlobalSymbols
/**
 * The "Send API".
 * It obtains an AppJWT for the connector when initialized and refreshes the JWT when necessary.
 * It exposes methods for sending info the UMS.
 *
 * @property {function} create
 * @property {function} send
 * @property {function} uploadImage
 * @property {function} on
 * @property {function} onAny
 */
class SendAPI extends Events {
    /**
     * Create a new instance of the SendAPI, which will store the application's details and authenticated JWT
     * @param {object} config - this account
     * @param {object} domains - this account's domains
     */
    constructor(config, domains) {
        super({wildcard:true});
        this.config = config;
        this.domains = domains;
        CLIENT_PROPERTIES_HEADER.appId = config.appId;
        this._init().catch(e => { this.emit('Sender.ERROR', `SendAPI Init failed: ${e}`) })
    }

    /**
     * Create a conversation
     * @param {string} jws - authentication token obtained from IDP, unique to a specific consumer
     * @param {array} events - array of events to send to the server
     * @returns {Promise<any>} response or error
     */
    create(jws, events) {
        let url = `https://${this.domains.asyncMessagingEnt}/api/account/${this.config.accountId}/messaging/consumer/conversation`;
        return new Promise((resolve, reject) => {
            request.post({
                url: url,
                qs: { 'v': '3' },
                json: true,
                headers: {
                    'Authorization': this.appJWT,
                    'X-LP-ON-BEHALF': jws,
                    'Content-Type': 'application/json',
                    'User-Agent': USER_AGENT_HEADER,
                    'Client-Properties': CLIENT_PROPERTIES_HEADER
                },
                body: events
            }, (err, response, body) => {
                if (err) reject(err);
                else {
                    resolve(body)
                }
            });
        })
    }

    /**
     * Send an event to a conversation
     * @param {string} jws - authentication token obtained from IDP, unique to a specific consumer
     * @param {object} event - event to send to the server
     * @returns {Promise<any>} response or error
     */
    send(jws, event) {
        //todo: complain about this
        let url = `https://${this.domains.asyncMessagingEnt}/api/account/${this.config.accountId}/messaging/consumer/conversation/send`;
        return new Promise((resolve, reject) => {
            request.post({
                url: url,
                qs: { 'v': '3' },
                json: true,
                headers: {
                    'Authorization': this.appJWT,
                    'X-LP-ON-BEHALF': jws,
                    'Content-Type': 'application/json',
                    'User-Agent': USER_AGENT_HEADER,
                    'Client-Properties': CLIENT_PROPERTIES_HEADER
                },
                body: event
            }, (err, response, body) => {
                if (err) reject(err);
                else {
                    resolve(body)
                }
            });
        })
    }

    /**
     * Upload a file to Swift image store
     * @param {string} filePath - path to the file in the file system
     * @param {object} fileUploadParams - body of the response to the "Request Upload URL" event
     * @param {string} fileUploadParams.relativePath
     * @param {string} fileUploadParams.queryParams.temp_url_sig
     * @param {string} fileUploadParams.queryParams.temp_url_expires
     * @returns {Promise<any>}
     */
    uploadImage(filePath, fileUploadParams) {
        let options = {
            method: 'PUT',
            url: `https://${this.domains.swiftDomain}${fileUploadParams.relativePath}`,
            qs: fileUploadParams.queryParams,
            headers: {
                'User-Agent': USER_AGENT_HEADER
            },
            formData: {
                async: true,
                resources: JSON.stringify({}),
                application: fs.createReadStream(filePath)
            }
        };
        console.log(options);
        return new Promise((resolve, reject) => {
            request(options, (err, response, body) => {
                if (err) reject(err);
                else resolve(response);
            });
        })
    }

    async _getJWT() {
        // todo: error handling / retries
        let response = await externalServices.getAppJWT(this.config.accountId, this.domains.sentinel, this.config.installationId, this.config.secret);
        this.appJWT = response.access_token;
        this.emit('Sender', 'SendAPI Token obtained');
        clearTimeout(this._tokenTimer);
        let _timeout = Math.floor(((1000 * jwt_decode(this.appJWT).exp - new Date())*.8));
        this._tokenTimer = setTimeout(()=> {
            this.emit('Sender', 'Renewing SendAPI Token.');
            this._getJWT();
        }, _timeout);
        return true;
    }


    /**
     * Initialize the Sender
     * @returns {Promise<boolean>}
     */
    async _init() {
        try {
            await this._getJWT();
            this.emit('Sender.ready');
            return true
        } catch (e) {
            this.emit('Sender.ERROR', `Unable to obtain AppJWT: ${e}`)
        }

    }
}

module.exports = SendAPI;

/**
 * @typedef {Object} GetAppJWTResponse
 * @property {string} access_token
 */