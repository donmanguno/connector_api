'use strict';

const express = require('express');
const ngrok = require('ngrok');
const bodyParser = require('body-parser');
const Events = require('eventemitter2');

/**
 * @property {function} on
 * @property {function} onAny
 */
class Listener extends Events {
    /**
     * Listener - The listener service creates an express server and exposes five routes
     * which should be configured as webhook endpoints in the connector's configuration.
     * When any route has data posted to it a corresponding event will be emitted by the
     * Listener.
     *
     * @param {object} config
     * @param {number} config.port
     * @param {boolean} [config.ngrok]
     */
    constructor (config) {
        super({wildcard: true});
        this.config = config;
        this.express = express();
        this.express.use(bodyParser.json());
        this._init().then(() => {
            this.emit('Listener.ready', `Listening ${this.url ? `at ${this.url}/event/:type` : `on port ${this.config.port}`}`)
        })
    }

    async _init () {
        this.express.post('/event/:type', (req, res) => {
            this._emitChanges(req.params.type, req.body, () => {return res.status(200).send()})
        });

        await new Promise(r => {
            this.express.listen(this.config.port, () => r(true))
        })

        if (this.config.ngrok) this.url = await ngrok.connect(this.config.port)
    }

    // TODO: promise instead of callback
    _emitChanges(type, event, cb) {
        console.log(type, JSON.stringify(event));
        if (event.body && event.body.changes && event.body.changes.length > 0) {
            event.body.changes.forEach(change => {
                this.emit(type, change)
            })
        }
        cb()
    }
}

module.exports = Listener;