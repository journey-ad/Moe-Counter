'use strict'

const mongoose = require('mongoose');
 
module.exports = new mongoose.Schema({
  name: { type: String, required: true },
  num:  { type: Number, required: true }
}, { collection: 'tb_count', versionKey: false });