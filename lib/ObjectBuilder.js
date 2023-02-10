'use strict';

const uuidv4 = require('uuid/v4');

class UMSEvent {
    /**
     * Generic UMS event constructor
     * @param {string} type - supported values include cm.ConsumerRequestConversation, 'cm.UpdateConversationField', 'ms.PublishEvent', 'userprofile.SetUserProfile'
     * @param {object} body - body of the request
     */
    constructor (type, body) {
        this.kind = 'req';
        this.id = uuidv4();
        this.type = type;
        this.body = body;
    }
}

// CM Events
class RequestConversationEvent extends UMSEvent {
    /**
     * "Request Conversation" event constructor
     * @extends UMSEvent
     * @param {string} accountId
     * @param {string} [skillId] - skill to route conversation to
     * @param {object} [campaignInfo] - info to use for routing by campaign/engagement
     * @param {string} campaignInfo.campaignId - campaignId to use for routing. required if campaignInfo is used.
     * @param {string} campaignInfo.engagementId - engagementId to use for routing. required if campaignInfo is used.
     */
    constructor (accountId, skillId, campaignInfo) {
        let body = {
            'ttrDefName': 'CUSTOM',
            'channelType': 'MESSAGING',
            'brandId': accountId
        };
        if (skillId) body.skillId = skillId;
        if (campaignInfo) body.campaignInfo = campaignInfo;
        super('cm.ConsumerRequestConversation', body)
    }
}

class EndConversationEvent extends UMSEvent {
    /**
     * "Close Conversation" event constructor
     * @extends UMSEvent
     * @param {string} conversationId
     */
    constructor (conversationId) {
        let body = {
            'conversationId': conversationId,
            'conversationField': {
                'field': 'ConversationStateField',
                'conversationState': 'CLOSE'
            }
        };
        super('cm.UpdateConversationField', body)
    }
}

// User Profile
class SetUserProfileEvent extends UMSEvent {
    /**
     * "Set User Profile" event constructor
     * @extends UMSEvent
     * @param {UserProfile} body - a UserProfile object
     */
    constructor (body) {
        super('userprofile.SetUserProfile', body)
    }
}

// MS Events
//  Publish Event
class PublishEvent extends UMSEvent {
    /**
     * Generic "Publish" event constructor
     * @extends UMSEvent
     * @param {object} event
     * @param {string} dialogId - dialogId (conversationId) to publish the event to
     */
    constructor (dialogId, event) {
        let body = {'event': event};
        if (dialogId) body.dialogId = dialogId;
        super('ms.PublishEvent', body)
    }
}


class PublishTextEvent extends PublishEvent {
    /**
     * "Publish Text" event constructor
     * @extends PublishEvent
     * @param {string} text - message to send on behalf of consumer
     * @param {string} dialogId - dialogId (conversationId) to send the text to
     */
    constructor (dialogId, text) {
        let event = {
            'type': 'ContentEvent',
            'contentType': 'text/plain',
            'message': text
        };
        super(dialogId, event)
    }
}

// todo: fix this
// todo: create jsdoc typedef for fileUploadParams
class PublishImageThumbnailEvent extends PublishEvent {
    /**
     * "Publish Image Thumbnail" event constructor
     * @param {string} dialogId - dialogId (conversationId) to send the thumbnail to
     * @param {string} [caption] - caption for image
     * @param {object} fileUploadParams - fileUploadParams from RequestUploadUrlEvent response
     * @param {string} fileType - three-letter filetype: png, jpg, or gif
     * @param {string} encodedImage - base64 encoded image thumbnail as string
     */
    constructor (dialogId, caption, fileUploadParams, fileType, encodedImage) {
        let event = {
            'type': 'ContentEvent',
            'contentType': 'hosted/file',
            'message': {
                'caption': caption,
                'relativePath': fileUploadParams.relativePath,
                'fileType': fileType,
                'preview': `data:image/${fileType.toLowerCase()};base64,${encodedImage}`
            }
        };
        super(dialogId, event);
    }
}

class PublishChatStateEvent extends PublishEvent {
    /**
     * "Publish Chat State" event constructor
     * @extends PublishEvent
     * @param {string} state - new state. Options include ACTIVE, INACTIVE, GONE, COMPOSING, PAUSE
     * @param {string} dialogId - dialogId (conversationId) for which to change the state of the consumer
     */
    constructor (dialogId, state) {
        let event = {
            'type': 'ChatStateEvent',
            'chatState': state
        };
        super(dialogId, event)
    }
}

class PublishAcceptStatusEvent extends PublishEvent {
    constructor(dialogId, sequenceList, status='ACCEPT') {
        let event = {
            'type': 'AcceptStatusEvent',
            'status': status,
            'sequenceList': sequenceList
        };
        super(dialogId, event)
    }
}

//  File Sharing
class RequestUploadURLEvent extends UMSEvent {
    /**
     * "Request File Upload URL" event constructor
     * @extends UMSEvent
     * @param {number} fileSize - file size in bytes
     * @param {string} fileType - file type. supported values include PNG, GIF, JPG
     */
    constructor (fileSize, fileType) {
        let body = {
            'fileSize': fileSize,
            'fileType': fileType
        };
        super('ms.GenerateURLForUploadFile', body)
    }
}


// UserProfile classes
class UserProfile {
    /**
     * UserProfile object constructor
     * @constructor
     * @param {string} [firstName]
     * @param {string} [lastName]
     * @param {string} [userId]
     * @param {string} [avatarUrl]
     * @param {string} [role]
     * @param {string} [backgndImgUri]
     * @param {string} [description]
     * @param {UserPrivateData} [userPrivateData]
     * @param {array<object>} [authenticatedSDEs] - array of SDEs
     */
    constructor (firstName, lastName, userId, avatarUrl, role, backgndImgUri,
                description, userPrivateData, authenticatedSDEs) {
        if (firstName) this.firstName = firstName;
        if (lastName) this.lastName = lastName;
        if (userId) this.userId = userId;
        if (avatarUrl) this.avatarUrl = avatarUrl;
        if (role) this.role = role;
        if (backgndImgUri) this.backgndImgUri = backgndImgUri;
        if (description) this.description = description;
        if (userPrivateData) this.userPrivateData = userPrivateData;
        if (authenticatedSDEs) this.authenticatedData = { "lp_sdes" : authenticatedSDEs };
    }
}

class UserPrivateData {
    /**
     * UserPrivateData object constructor
     * @constructor
     * @param {string} [mobileNum]
     * @param {string} [mail]
     * @param {object} [pushNotificationData]
     * @param {string} [pushNotificationData.serviceName]
     * @param {string} [pushNotificationData.certName]
     * @param {string} [pushNotificationData.token]
     */
    constructor (mobileNum, mail, pushNotificationData) {
        if (mobileNum) this.mobileNum = mobileNum;
        if (mail) this.mail = mail;
        if (pushNotificationData) this.pushNotificationData = pushNotificationData;
    }
}

module.exports = {
    EventBuilder: {
        RequestConversationEvent,
        SetUserProfileEvent,
        PublishTextEvent,
        PublishImageThumbnailEvent,
        PublishChatStateEvent,
        PublishAcceptStatusEvent,
        EndConversationEvent,
        RequestUploadURLEvent,
    },
    ObjectBuilder: {
        UserProfile,
        UserPrivateData
    }
};