const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  clientName: { type: String, required: true },
  content: { type: String },
  background: { type: String },
  pageSize: { type: String, default: 'A4' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Proposal', proposalSchema);
