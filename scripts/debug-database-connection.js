const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/investment';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`   URI: ${MONGODB_URI}`);
    console.log(`   Database: ${mongoose.connection.db.databaseName}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
}

async function debugDatabaseConnection() {
  console.log('🔍 DEBUGGING DATABASE CONNECTION\n');
  console.log('=' .repeat(80));
  
  try {
    const db = mongoose.connection.db;
    
    // List all collections
    console.log('📚 ALL COLLECTIONS IN DATABASE:\n');
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('❌ NO COLLECTIONS FOUND');
    } else {
      console.log(`📊 Found ${collections.length} collections:\n`);
      
      for (const collection of collections) {
        console.log(`   📁 ${collection.name}`);
        console.log(`      Type: ${collection.type}`);
        console.log(`      Options: ${JSON.stringify(collection.options)}`);
        console.log('');
      }
    }
    
    // Check specific collections
    console.log('🎯 CHECKING SPECIFIC COLLECTIONS:\n');
    
    const collectionNames = ['transactions', 'investments', 'users', 'wallets'];
    
    for (const collectionName of collectionNames) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`   📊 ${collectionName}: ${count} documents`);
      } catch (error) {
        console.log(`   ❌ ${collectionName}: Error - ${error.message}`);
      }
    }
    
    console.log('');
    
    // Try to find any transactions with different approaches
    console.log('🔍 TRYING DIFFERENT TRANSACTION SEARCH APPROACHES:\n');
    
    // Approach 1: Direct collection access
    try {
      const transactionsCollection = db.collection('transactions');
      const allTransactions = await transactionsCollection.find({}).limit(5).toArray();
      console.log(`   📋 Direct collection access - Found ${allTransactions.length} transactions`);
      
      if (allTransactions.length > 0) {
        console.log('   Sample transaction:');
        console.log(`      ID: ${allTransactions[0]._id}`);
        console.log(`      Type: ${allTransactions[0].type}`);
        console.log(`      Amount: ${allTransactions[0].amount}`);
        console.log(`      Created: ${allTransactions[0].createdAt}`);
      }
    } catch (error) {
      console.log(`   ❌ Direct collection access failed: ${error.message}`);
    }
    
    // Approach 2: Try different collection names
    const possibleNames = ['transaction', 'transactions', 'Transaction', 'Transactions'];
    
    for (const name of possibleNames) {
      try {
        const collection = db.collection(name);
        const count = await collection.countDocuments();
        console.log(`   📊 Collection '${name}': ${count} documents`);
        
        if (count > 0) {
          const sample = await collection.findOne({});
          console.log(`      Sample document type: ${sample.type || 'N/A'}`);
        }
      } catch (error) {
        console.log(`   ❌ Collection '${name}': Error - ${error.message}`);
      }
    }
    
    console.log('');
    
  } catch (error) {
    console.error('❌ Error debugging database connection:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await debugDatabaseConnection();
  } catch (error) {
    console.error('❌ Main error:', error);
  } finally {
    await disconnectDB();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { debugDatabaseConnection };
