const mongoose = require('mongoose');

async function run() {
  const uri = "mongodb+srv://thakuravantik5_db_user:UVJ1dc079Ndun8F3@cluster0.vbavmqg.mongodb.net/";
  await mongoose.connect(uri);
  console.log("Connected to MongoDB!");

  const TeamSchema = new mongoose.Schema({}, { strict: false });
  const Team = mongoose.model('Team', TeamSchema);

  const teams = await Team.find();
  console.log("Raw Teams:", JSON.stringify(teams, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
