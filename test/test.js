'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const config = require('./config/config');

const ExternalServices = require('../lib/ExternalServices');
const SendAPI = require('../lib/SendAPI');
const {events, objects} = require('../lib/ObjectBuilder');
const Utilities = require('../lib/Utilities');

let domains, jwt, jws, sendAPI, convId, fileUploadParams;

describe('ExternalServices', () => {
    before(() => {
        return ExternalServices.getDomains(config.accountId, config.csdsDomain)
            .then(result => domains = result)
    });

    describe('#getAppJWT', () => {
        it('should return a jwt', () => {
            return expect(
                ExternalServices.getAppJWT(config.accountId, domains.sentinel, config.installationId, config.secret)
                    .then(result => { return jwt = result })
            ).to.eventually.have.property('access_token');
        })
    });

    describe('#getAppJWS', () => {
        it('should return a jws', () => {
            return expect(
                ExternalServices.getAppJWS(config.accountId, domains.idp, jwt.access_token)
                    .then(result => { return jws = result })
            ).to.eventually.have.property('token');
        })
    });

//     describe('#conversationHistory', () => {
//         it('should return a jws', () => {
//             return ExternalServices.conversationHistory(config.accountId, domains.msgHist, config.consumerPID, 'CLOSE', config.oauthParams).should.be.fulfilled
//
//         })
//     });
//
//     describe('#getAgentNickName', () => {
//         it('should return a jws', () => {
//             return expect(
//                 ExternalServices.getAgentNickname(config.accountId, domains.acCdnDomain, config.agentPID)
//                     .then(result => { return result })
//             ).to.eventually.exist();
//         })
//     })
// });
//
// describe('SendAPI', () => {
//     describe('Basic Conversation Flow', () => {
//         let response;
//         before(() => {
//             sendAPI = new SendAPI(config.accountId, domains, jwt.access_token);
//             return sendAPI.sendEvents(jws.token, [
//                 new events.SetUserProfileEvent('1', new objects.UserProfile('Mark', 'ConnectorTest')),
//                 new events.RequestConversationEvent('2', config.accountId)
//             ]).then(result => {
//                 response = result;
//                 try { convId = response.find(r => r.reqId === '2').body.conversationId }
//                 catch (e) {console.error(e)}
//             }).catch(e => {
//                 console.error(e);
//             })
//         });
//
//         it('should set a user profile', () => {
//             expect(response.find(r => r.reqId === '1')).to.have.property('code','OK')
//         });
//
//         it('should create a new conversation', () => {
//             expect(response.find(r => r.reqId === '2')).to.have.property('code','OK')
//         });
//
//         it('should send a line of text', () => {
//             return expect(
//                 sendAPI.sendEvents(
//                     jws.token, new PublishTextEvent('1', convId, 'Mark\'s Connector Conversation'), convId
//                 )
//             ).to.eventually.have.property('code','OK')
//         });
//
//         it('should request a file upload url', () => {
//             return expect(
//                 sendAPI.sendEvents(
//                     jws.token, new RequestUploadURLEvent('1', 69666, 'JPG'), convId
//                 ).then(result => { fileUploadParams = result.body; return result })
//             ).to.eventually.have.property('code','OK')
//         });
//
//         // it('should upload a file', () => {
//         //     return expect(
//         //         sendAPI.uploadImage(__dirname+'/images/doge.jpg', fileUploadParams)
//         //     ).to.eventually.have.property('statusCode', 201)
//         // });
//         //
//         // it('should send a base64 image thumbnail to the conversation', () => {
//         //     return expect(
//         //         Utilities.createEncodedThumbnail(__dirname+'/images/doge.jpg')
//         //             .then(encodedImage => {
//         //                 let event = new PublishImageThumbnailEvent('1', convId, 'doge!', fileUploadParams, 'JPG', encodedImage);
//         //                 console.log(JSON.stringify(event));
//         //                 return sendAPI.sendEvents(
//         //                     jws.token,
//         //                     event,
//         //                     convId
//         //                 )
//         //             })
//         //     ).to.eventually.have.property('code','OK')
//         // });
//
//         it('should end the conversation', () =>{
//             return expect(
//                 sendAPI.sendEvents(
//                     jws.token, new EndConversationEvent('1', convId), convId
//                 )
//             ).to.eventually.have.property('code','OK')
//         })
//     })
});