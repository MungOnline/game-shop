const Setting = require('../models/Setting');

const defaultSettings = {
  facebook: 'IJMGamer',
  youtube: 'IJMGamer',
  discord: 'discord.gg/YWqaQbRNBN',
  contactEmail: '',
  bankName: 'ธนาคาร xxx',
  bankAccount: 'xxx-x-xxxxx-x',
  bankHolder: 'xxxxxxxxx',
  workingHoursWeekday: '09:00 - 22:00 น.',
  workingHoursWeekend: '10:00 - 20:00 น.',
  helpHowToOrder: '',
  helpFAQ: ''
};

let settingsCache = null;

const getSettings = async () => {
  if (settingsCache) return settingsCache;
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create(defaultSettings);
  }
  settingsCache = settings;
  return settings;
};

const clearCache = () => { settingsCache = null; };

module.exports = { getSettings, clearCache };
