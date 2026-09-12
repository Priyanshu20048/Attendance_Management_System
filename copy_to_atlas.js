require('dotenv').config();
const mongoose = require('mongoose');

const LOCAL_URI = process.env.LOCAL_MONGO || 'mongodb://127.0.0.1:27017/attendanceDB';
const ATLAS_URI = process.env.MONGO_URI;

if (!ATLAS_URI) {
  console.error('MONGO_URI not set in .env. Aborting.');
  process.exit(1);
}

async function copy() {
  const localConn = mongoose.createConnection(LOCAL_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  const atlasConn = mongoose.createConnection(ATLAS_URI, {
    serverSelectionTimeoutMS: 10000,
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
  });

  // wait for both connections to be ready
  await Promise.all([
    new Promise((res, rej) => localConn.once('open', res)),
    new Promise((res, rej) => atlasConn.once('open', res)),
  ]);

  try {
    const db = localConn.db;
    const target = atlasConn.db;

    const collections = ['students', 'users', 'attendances'];

    for (const name of collections) {
      console.log(`Copying collection: ${name}`);
      const docs = await db.collection(name).find().toArray();
      console.log(`  Found ${docs.length} documents`);

      if (docs.length === 0) {
        console.log(`  Skipping empty collection ${name}`);
        continue;
      }

      // Replace target collection with local data
      await target.collection(name).deleteMany({});
      // Insert documents preserving _id
      await target.collection(name).insertMany(docs, { ordered: false });
      console.log(`  Restored ${docs.length} documents to Atlas.${name}`);
    }

    console.log('\nAll selected collections copied successfully.');
  } catch (err) {
    console.error('Error during copy:', err);
  } finally {
    await localConn.close();
    await atlasConn.close();
  }
}

copy();
