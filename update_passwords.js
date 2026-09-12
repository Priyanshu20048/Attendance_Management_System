require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI missing in .env — aborting');
  process.exit(1);
}

async function run() {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  // Use a loose schema to access the existing collection
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');

  const adminPlain = process.env.ADMIN_PASSWORD;
  const teacherPlain = process.env.TEACHER_PASSWORD;
  if (!adminPlain || !teacherPlain) {
    console.error('ADMIN_PASSWORD and TEACHER_PASSWORD must be set in .env. Aborting');
    process.exit(1);
  }
  const saltRounds = 10;

  console.log('Hashing passwords...');
  const [adminHash, teacherHash] = await Promise.all([
    bcrypt.hash(adminPlain, saltRounds),
    bcrypt.hash(teacherPlain, saltRounds),
  ]);

  console.log('Updating admin passwords...');
  const adminRes = await User.updateMany({ role: 'admin' }, { $set: { password: adminHash } });

  console.log('Updating teacher passwords...');
  const teacherRes = await User.updateMany({ role: 'teacher' }, { $set: { password: teacherHash } });

  const adminsUpdated = adminRes.modifiedCount ?? adminRes.nModified ?? adminRes.n ?? 0;
  const teachersUpdated = teacherRes.modifiedCount ?? teacherRes.nModified ?? teacherRes.n ?? 0;

  console.log(`Admins updated: ${adminsUpdated}`);
  console.log(`Teachers updated: ${teachersUpdated}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Error updating passwords:', err);
  process.exit(1);
});
