import mongoose from 'mongoose';

const subSubCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    subCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory', // Reference to SubCategory
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // Reference to Category
        required: true
    },
    priority: {
        type: Number,
        default: 0
    },
}, { timestamps: true });

const SubSubCategory = mongoose.model('SubSubCategory', subSubCategorySchema);
export default SubSubCategory;
