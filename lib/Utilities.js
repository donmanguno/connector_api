'use strict';

const thumb = require('node-thumbnail').thumb;
const fs = require('fs');

function createThumbnail (filePath) {
    return thumb({
        source: filePath,
        destination: /.+\//g.exec(filePath)[0],
        width: 256
    })
}

async function base64Encode (filePath) {
    fs.readFile(filePath, (err, data) => {
        if (err) throw err
        else return data
    })
}

function createEncodedThumbnail(filePath) {
    return createThumbnail(filePath)
      .then(output => {
          return base64Encode(output[0].dstPath)
      })
}

module.exports = {
    createEncodedThumbnail
};