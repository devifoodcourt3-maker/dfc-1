/**
 * MongoDB Data Transfer Script
 * 
 * Transfers ALL data from your old MongoDB cluster to a new one.
 * 
 * Usage:
 *   node transfer-data.js
 * 
 * Before running:
 *   1. Set OLD_MONGODB_URI to your current/old connection string
 *   2. Set NEW_MONGODB_URI to your new connection string
 */

const { MongoClient } = require('mongodb');

// ============================================================
// ⚠️  PASTE YOUR CONNECTION STRINGS BELOW  ⚠️
// ============================================================

const OLD_MONGODB_URI = process.env.OLD_MONGODB_URI || 'PASTE_YOUR_OLD_CONNECTION_STRING_HERE';

const NEW_MONGODB_URI = process.env.NEW_MONGODB_URI || 'PASTE_YOUR_NEW_CONNECTION_STRING_HERE';

// ============================================================

async function transferData() {
  if (NEW_MONGODB_URI === 'PASTE_YOUR_NEW_CONNECTION_STRING_HERE') {
    console.error('\n❌ ERROR: Please set NEW_MONGODB_URI in the script before running!');
    console.error('   Open transfer-data.js and paste your new MongoDB connection string on line 23.\n');
    process.exit(1);
  }

  let oldClient, newClient;

  try {
    // Connect to both clusters
    console.log('🔗 Connecting to OLD database...');
    oldClient = new MongoClient(OLD_MONGODB_URI);
    await oldClient.connect();
    console.log('✅ Connected to OLD database\n');

    console.log('🔗 Connecting to NEW database...');
    newClient = new MongoClient(NEW_MONGODB_URI);
    await newClient.connect();
    console.log('✅ Connected to NEW database\n');

    // Get the database name from the old URI
    const dbName = OLD_MONGODB_URI.split('/').pop().split('?')[0];
    console.log(`📦 Database name: ${dbName}\n`);

    const oldDb = oldClient.db(dbName);
    const newDb = newClient.db(dbName);

    // Get all collections from old database
    const collections = await oldDb.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections to transfer:\n`);
    collections.forEach(col => console.log(`   - ${col.name}`));
    console.log('');

    let totalDocuments = 0;

    // Transfer each collection
    for (const collectionInfo of collections) {
      const collName = collectionInfo.name;
      const oldCollection = oldDb.collection(collName);
      const newCollection = newDb.collection(collName);

      // Get all documents from old collection
      const documents = await oldCollection.find({}).toArray();
      const count = documents.length;

      if (count === 0) {
        console.log(`   ⏭️  ${collName}: 0 documents (skipped)`);
        continue;
      }

      // Drop existing collection in new DB to avoid duplicates
      try {
        await newCollection.drop();
      } catch (e) {
        // Collection doesn't exist in new DB, that's fine
      }

      // Insert all documents into new collection
      await newCollection.insertMany(documents);
      totalDocuments += count;
      console.log(`   ✅ ${collName}: ${count} documents transferred`);

      // Also copy indexes
      const indexes = await oldCollection.indexes();
      for (const index of indexes) {
        if (index.name === '_id_') continue; // Skip default _id index
        try {
          const { key, ...options } = index;
          delete options.v; // Remove version field
          await newCollection.createIndex(key, options);
        } catch (e) {
          // Index might already exist, ignore
        }
      }
    }

    console.log(`\n🎉 Transfer complete! ${totalDocuments} total documents transferred.`);
    console.log('\n📝 Next steps:');
    console.log('   1. Update MONGODB_URI in your .env file with the new connection string');
    console.log('   2. Restart your backend server: npm run dev');
    console.log('   3. Test that everything works correctly\n');

  } catch (error) {
    console.error('\n❌ Transfer failed:', error.message);
    if (error.message.includes('ENOTFOUND') || error.message.includes('authentication')) {
      console.error('\n💡 Tips:');
      console.error('   - Check your connection string is correct');
      console.error('   - Make sure your IP is whitelisted in MongoDB Atlas → Network Access');
      console.error('   - Verify username/password are correct\n');
    }
    process.exit(1);
  } finally {
    if (oldClient) await oldClient.close();
    if (newClient) await newClient.close();
  }
}

transferData();
