const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  facebook: { type: String, default: 'IJMGamer' },
  youtube: { type: String, default: 'IJMGamer' },
  discord: { type: String, default: 'discord.gg/YWqaQbRNBN' },
  contactEmail: { type: String, default: '' },
  bankName: { type: String, default: 'ธนาคาร xxx' },
  bankAccount: { type: String, default: 'xxx-x-xxxxx-x' },
  bankHolder: { type: String, default: 'xxxxxxxxx' },
  workingHoursWeekday: { type: String, default: '09:00 - 22:00 น.' },
  workingHoursWeekend: { type: String, default: '10:00 - 20:00 น.' },
  helpHowToOrder: { type: String, default: '' },
  helpFAQ: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
