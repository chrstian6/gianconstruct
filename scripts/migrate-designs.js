const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

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
        createdBy: {
          type: String,
          required: true,
          trim: true,
          default: "Admin",
        },
        isLoanOffer: { type: Boolean, required: true, default: false },
        maxLoanYears: {
          type: Number,
          min: 1,
          max: 30,
          required: false,
          default: null,
        },
        interestRate: { type: Number, min: 0, required: false, default: null },
      },
      { timestamps: true }
    );

    const Design =
      mongoose.models.Design || mongoose.model("Design", DesignSchema);

    // Update designs with missing or invalid fields
    const result = await Design.updateMany(
      {
        $or: [
          { category: { $in: [null, "", undefined, true] } },
          { createdBy: { $in: [null, "", undefined] } },
          { isLoanOffer: { $exists: false } },
          { maxLoanYears: { $exists: false } },
          { interestRate: { $exists: false } },
        ],
      },
      {
        $set: {
          category: "Residential",
          createdBy: "Admin",
          isLoanOffer: false,
          maxLoanYears: null,
          interestRate: null,
        },
      }
    );

    console.log(`Updated ${result.modifiedCount} designs with default values`);

    // Ensure unique index on design_id
    await Design.collection.dropIndexes();
    await Design.collection.createIndex({ design_id: 1 }, { unique: true });

    console.log("Unique index on design_id recreated");
    mongoose.connection.close();
  })
  .catch((error) => {
    console.error("Migration error:", error);
    mongoose.connection.close();
  });
