'use strict';

const _ = require('lodash');
const Events = require('eventemitter2');
const SendAPI = require('./SendAPI');
const Listener = require('./Listener');
const externalServices  = require('./ExternalServices');
const { EventBuilder, ObjectBuilder } = require('./ObjectBuilder');


/**
 * @property {function} openConversation
 * @property {function} startConversation
 * @property {function} getOpenConversation
 * @property {function} sendText
 * @property {function} setTyping
 * @property {function} setMsgAcceptStatus
 * @property {function} getAgentNickname
 * @property {function} onAny
 * @property {function} on
 * @property {object} objects
 * @property {constructor} objects.UserProfile
 * @property {constructor} objects.UserPrivateData
 */

class Connector extends Events {
    /**
     * Build a connector
     * @param {object} config
     * @param {string} config.accountId
     * @param {string} config.csdsDomain
     * @param {string} config.installationId
     * @param {string} config.secret
     * @param {number} config.port
     * @param {object} config.oauthParams - oAuth parameters for Messaging Interactions API
     * @param {string} config.oauthParams.consumer_key
     * @param {string} config.oauthParams.consumer_secret
     * @param {string} config.oauthParams.token
     * @param {string} config.oauthParams.token_secret
     */
    constructor(config) {
        super({wildcard:true});
        this._config = config;
        this._convs = [];
        this._events = EventBuilder;
        this.objects = ObjectBuilder;
        this._init(this._config).catch(e => `[Connector._init] ${e}`);
    }


    async _init(config) {
        this._domains = await externalServices.getDomains(config.accountId, config.csdsDomain);
        this.emit('Connector', 'domains retrieved');

        // start listener
        this._listener = new Listener(config);
        this._listener.onAny((event, value) => { this.emit(event, value) });

        // start sender
        this._sendAPI = new SendAPI(config, this._domains);
        this._sendAPI.onAny((event, value) => { this.emit(event, value) });
        this._sendAPI.on('Sender.ready', () => { this.emit('Connector.ready') });

        return true;
    }

    /**
     * Start a new conversation.
     * Returns a conversation object if successful, throws a Conversation object if the user already has a conversation.
     * @param externalConsumerId
     * @param userProfile
     * @returns {Promise<Conversation>}
     * @throws {Conversation | string}
     */
    async startConversation (externalConsumerId, userProfile) {
        let thisConversation = new Conversation(externalConsumerId, userProfile);
        this._convs.push(thisConversation);

        thisConversation.jws = await this._getJWS(thisConversation);

        let umsResponse = await this._sendAPI.create(thisConversation.jws.token, [
            new this._events.SetUserProfileEvent(userProfile),
            new this._events.RequestConversationEvent(this._config.accountId)
        ]);

        if (umsResponse[1].body.conversationId) {
            this.emit('Sender', `Conversation ${umsResponse[1].body.conversationId} opened for ${externalConsumerId}`);
            return _.merge(thisConversation, { conversationId: umsResponse[1].body.conversationId })
        }

        // todo: complain about this (regex to return userid)
        if (umsResponse[1].code === 'BAD_REQUEST') {
            this.emit('Connector', umsResponse[1].body.msg);
            let regexOutput = /User (\w+) already/.exec(umsResponse[1].body.msg);
            if (regexOutput) {
                thisConversation.userId = regexOutput[1];
                this.emit('Connector', `userId ${thisConversation.userId} extracted`);
                throw thisConversation
            }
            throw '[connector.startConversation] no conversationId extracted'
        }
    }

    /**
     * Retrieve a user's ongoing conversation using their conversationId
     * @param {string} userId
     * @returns {Promise<string>} conversationId
     * @throws {string}
     */
    async getOpenConversation (userId) {
        let conversations = await externalServices.conversationHistory(this._config.accountId, this._domains.msgHist, userId, 'OPEN' ,this._config.oauthParams);
        if (conversations.body._metadata.count < 1) throw `[connector.getOpenConversation] no conversations found for ${userId}`;
        return _.last(conversations.body.conversationHistoryRecords).info.conversationId;
    }

    /**
     * Set user's profile and either start a new conversation or return their ongoing conversation.
     * @param {string} externalConsumerId
     * @param {UserProfile} userProfile
     * @returns {Promise<Conversation>}
     * @throws {string}
     */
    async openConversation (externalConsumerId, userProfile) {
        try {
            let conversation = await this.startConversation(externalConsumerId, userProfile);
            return conversation
        } catch (e) {
            if (e.userId) {
                let conversation = e;
                conversation.conversationId = await this.getOpenConversation(e.userId)
                return conversation;
            }
            else throw `[connector.openConversation] ${e.message}`
        }

    }

    /**
     * Get an agent's nickname using their PID
     * @param pid
     * @returns {Promise<string>}
     */
    getAgentNickname (pid) {
        return externalServices.getAgentNickname(this._config.accountId, this._domains.acCdnDomain, pid)
    }

    /**
     * Send a line of text to a LiveEngage conversation
     * @param {string} conversationId
     * @param {string} text
     * @returns {Promise<any>}
     */
    sendText (conversationId, text) {
        let conversation = _.find(this._convs, [ 'conversationId', conversationId ]),
            event = new this._events.PublishTextEvent(conversationId, text);
        return this._sendAPI.send(conversation.jws.token, event)
    };

    /**
     * Notify LiveEngage that the consumer is typing or has stopped typing
     * @param {string} conversationId
     * @param {boolean} typing - Is the consumer typing?
     * @returns {Promise<any>}
     */
    setTyping (conversationId, typing) {
        let conversation = _.find(this._convs, [ 'conversationId', conversationId ]),
            event = new this._events.PublishChatStateEvent(conversationId, typing ? 'COMPOSING' : 'ACTIVE');
        return this._sendAPI.send(conversation.jws.token, event)
    };

    /**
     * Mark messages as read
     * @param conversationId
     * @param sequenceList
     * @returns {Promise<any>}
     */
    setMsgAcceptStatus (conversationId, sequenceList) {
        let conversation = _.find(this._convs, [ 'conversationId', conversationId ]),
            event = new this._events.PublishAcceptStatusEvent(conversationId, sequenceList);
        return this._sendAPI.send(conversation.jws.token, event)
    }

    /**
     * Obtain a JWS for a consumer
     * @param conversation
     * @returns {Promise<Object|string>}
     * @private
     */
    _getJWS (conversation) {
        return externalServices.getAppJWS(this._config.accountId, this._domains.idp, this._sendAPI.appJWT, conversation.externalConsumerId)
    }
}

/**
 * @class Conversation
 * @property {string} externalConsumerId
 * @property {UserProfile} userProfile
 * @property {string} userId
 * @property {string} jws
 * @property {string} conversationId
 * @property {boolean} connected
 */
class Conversation {
    constructor(externalConsumerId, userProfile, userId, jws, conversationId) {
        this.externalConsumerId = externalConsumerId;
        this.userProfile = userProfile
    }
}

module.exports = Connector;