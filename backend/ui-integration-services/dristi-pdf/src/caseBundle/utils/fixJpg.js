const sharp = require("sharp");

/**
 *
 * @param {*} jpgBuffer
 * @returns
 */
async function fixJpg(jpgBuffer) {
  return await sharp(jpgBuffer).jpeg().toBuffer();
}

module.exports = {
  fixJpg,
};
