const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  identifier: { type: String, unique: true, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['student', 'professor'], required: true },
      status: { type: String, enum: ['pending', 'approved'], default: 'pending' }
    }
  ],
});

module.exports = mongoose.model('Group', groupSchema);
