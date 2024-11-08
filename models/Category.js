import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    priority: {
        type: String,
        required: true,
    },
    logo: {
        type: String, // URL of the uploaded image
        required: true,
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Inactive',
    },
}, {
    timestamps: true,
});

const Category = mongoose.model('Category', categorySchema);
export default Category;
