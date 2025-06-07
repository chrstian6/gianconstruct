const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to MongoDB");

    const DesignSchema = new mongoose.Schema(
      {
        design_id: { type: String, required: true, unique: true, trim: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        number_of_rooms: { type: Number, required: true, min: 1 },
        square_meters: { type: Number, required: true, min: 0 },
        category: { type: String, required: true, trim: true },
        images: [{ type: String, required: true }],
      },
      { timestamps: true }
    );

    const Design =
      mongoose.models.Design || mongoose.model("Design", DesignSchema);

    // Update designs without category
    const result = await Design.updateMany(
      { category: { $exists: false } },
      { $set: { category: "Residential" } }
    );

    console.log(
      `Updated ${result.modifiedCount} designs with default category 'Residential'`
    );
    mongoose.connection.close();
  })
  .catch((error) => {
    console.error("Migration error:", error);
    mongoose.connection.close();
  });
