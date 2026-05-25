const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  name: { type: String, default: 'Jeduthun Musicals' },
  address: { type: String, default: '314A/17, North Main Road, Valliyur, Tirunelveli Dist - 627117, Tamil Nadu' },
  phone1: { type: String, default: '04637-213875' },
  phone2: { type: String, default: '+91 8838858275' },
  gstNo: { type: String, default: '33KVOPS8216M1ZM' },
  email: { type: String, default: '' },
  bankName: { type: String, default: '' },
  accountNo: { type: String, default: '' },
  ifscCode: { type: String, default: '' },
  accountHolder: { type: String, default: '' },
  upiId: { type: String, default: '' },
  socialMedia: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    youtube: { type: String, default: '' },
    whatsapp: { type: String, default: '' }
  },
  quotationNotes: {
    type: String,
    default: '1. Transportation charges extra.\n2. Installation is not included in this quote.'
  }
}, { timestamps: true });

module.exports = mongoose.model('Shop', shopSchema);
