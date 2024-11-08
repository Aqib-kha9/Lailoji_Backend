import mongoose from "mongoose";

// Define the field schema for each withdrawal method
const FieldSchema = new mongoose.Schema({
  fieldName: {
    type: String,
    required: true,
  },
  inputType: {
    type: String,
    enum: ["String", "Number", "Date", "Password", "Email", "Phone"],
    required: true,
  },
  placeholder: {
    type: String,
    default: "",
  },
  isRequired: {
    type: Boolean,
    default: false,
  },
});

// Define the withdrawal method schema
const WithdrawalMethodSchema = new mongoose.Schema({
  methodName: {
    type: String,
    required: true,
    unique: true, // Ensures method names are unique
  },
  fields: [FieldSchema], // Array of fields
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true }); // timestamps will add createdAt and updatedAt fields

// Ensure only one method is marked as default
WithdrawalMethodSchema.pre("save", async function (next) {
  if (this.isDefault) {
    await mongoose.model("WithdrawalMethod").updateMany(
      { isDefault: true },
      { $set: { isDefault: false } }
    );
  }
  next();
});

export default mongoose.model("WithdrawalMethod", WithdrawalMethodSchema);
