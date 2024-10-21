import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // Assuming there is a Category model
        required: true
    },
    priority: {
        type: Number,
        default: 0
    },
}, { timestamps: true });

const SubCategory = mongoose.model('SubCategory', subCategorySchema);
export default SubCategory;
