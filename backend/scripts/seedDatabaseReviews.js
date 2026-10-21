const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const seedReviews = require('../data/seedReviews.json');

const ReviewSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    product_id: { type: Number, required: true, index: true },
    product_name: { type: String, required: true },
    customer_name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    comment: { type: String, required: true },
    location: { type: String, default: 'India' },
    verified_purchase: { type: Boolean, default: true },
    status: { type: String, default: 'approved' },
    helpful_count: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now }
}, { strict: false });

const ReviewModel = mongoose.model('Review', ReviewSchema);
const ProductModel = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('Connected to MongoDB. Seeding reviews...');
    await ReviewModel.deleteMany({});
    await ReviewModel.insertMany(seedReviews);
    const count = await ReviewModel.countDocuments();
    console.log('Total reviews in MongoDB now:', count);
    
    // Update products rating & review_count
    const reviewStats = [
        { id: 1, rating: 4.9, review_count: 82 },
        { id: 2, rating: 4.9, review_count: 74 },
        { id: 3, rating: 4.9, review_count: 91 },
        { id: 4, rating: 4.9, review_count: 68 },
        { id: 5, rating: 4.9, review_count: 88 },
        { id: 6, rating: 4.9, review_count: 76 }
    ];
    for (const st of reviewStats) {
        await ProductModel.updateOne({ id: st.id }, { $set: { rating: st.rating, review_count: st.review_count } });
    }
    const updatedProds = await ProductModel.find({}).lean();
    console.log('\n--- VERIFIED PRODUCTS IN MONGODB ---');
    updatedProds.forEach(p => console.log(`Product #${p.id} (${p.name}): Rating ${p.rating} ★ | ${p.review_count} Reviews`));
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
