'use strict';

const express = require('express');
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
     */
    constructor (config) {
        super({wildcard: true});
        this.config = config;
        this.express = express();
        this.express.use(bodyParser.json());
        this._init()
    }

    _init () {
        this.express.post('/event/:type', (req, res) => {
            this._emitChanges(req.params.type, req.body, () => {return res.status(200).send()})
        });

        this.express.listen(this.config.port, () => {
            this.emit('Listener.ready', `Listening on port ${this.config.port}`)
        })
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