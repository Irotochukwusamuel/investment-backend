/*
  Usage:
    NODE_ENV=production MONGODB_URI="mongodb+srv://..." node scripts/check-user-roi-by-email.js clairclancy@gmail.com
*/

const mongoose = require('mongoose');
require('dotenv').config();

const emailArg = process.argv[2];
if (!emailArg) {
  console.error('Please provide an email: node scripts/check-user-roi-by-email.js <email>');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/investment';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Investment = mongoose.model('Investment', new mongoose.Schema({}, { strict: false }));
  const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));

  const user = await User.findOne({ email: emailArg }).lean();
  if (!user) {
    console.log(`❌ No user found for ${emailArg}`);
    await mongoose.disconnect();
    return;
  }

  console.log(`👤 User: ${user.firstName || ''} ${user.lastName || ''} <${user.email}>`);
  console.log(`🆔 User ID: ${user._id}`);

  const investments = await Investment.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
  console.log(`\n📊 Investments: ${investments.length}`);
  for (const inv of investments) {
    console.log(` - ${inv._id} | ${inv.amount} ${inv.currency} | dailyRoi=${inv.dailyRoi}% | status=${inv.status}`);
    console.log(`   earnedAmount=${inv.earnedAmount} totalAccumulatedRoi=${inv.totalAccumulatedRoi}`);
    console.log(`   nextRoiCycleDate=${inv.nextRoiCycleDate} nextRoiUpdate=${inv.nextRoiUpdate}`);
  }

  const roiTx = await Transaction.find({ userId: user._id, type: 'roi' })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  console.log(`\n💳 ROI transactions: ${roiTx.length}`);
  roiTx.forEach((tx, i) => {
    console.log(` ${i + 1}. ${tx.amount} ${tx.currency} | ${tx.status} | ${tx.createdAt} | inv=${tx.investmentId}`);
    if (tx.description) console.log(`    ${tx.description}`);
  });

  const totalRoiTx = await Transaction.countDocuments({ userId: user._id, type: 'roi' });
  const statusBreakdown = await Transaction.aggregate([
    { $match: { userId: user._id, type: 'roi' } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  console.log(`\n📈 Total ROI tx count: ${totalRoiTx}`);
  console.log('📈 ROI tx by status:', statusBreakdown);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('❌ Error:', err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});



