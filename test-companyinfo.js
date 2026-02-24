const mongoose = require('mongoose');
const CompanyInfo = require('./api/models/CompanyInfo');
require('dotenv').config();

// Connect using localhost for the script if the local mongo is running
mongoose.connect('mongodb://127.0.0.1:27017/LibreChat').then(async () => {
  const result = await CompanyInfo.find().lean();
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}).catch(err => {
  console.log('Error', err.message);
  process.exit(1);
});
