import mongoose from 'mongoose';

const dealOfTheDaySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // Reference to Product model
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Expired'],
    default: 'Active', // Optional field with a default value
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const DealOfTheDay = mongoose.model('DealOfTheDay', dealOfTheDaySchema);

export default DealOfTheDay;
