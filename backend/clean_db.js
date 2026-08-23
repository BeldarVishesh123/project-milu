const mongoose = require('mongoose');
const crypto = require('crypto');

const uri = process.env.MONGODB_URI || "mongodb+srv://beldarvishesh4552_db_user:ZgnRTOFeQahqcvlS@krishivcorp.vdaebdn.mongodb.net/krishiv_co?retryWrites=true&w=majority";

const mockProducts = [
    {
        id: 1,
        name: 'Orange Peel',
        tag: 'BRIGHTENING',
        category: 'Skin Care',
        description: 'A rich, brightening formulation made from sun-dried orange peels. Naturally high in Vitamin C, it reduces dark spots, controls excess oil, and gives your skin a vibrant glow.',
        price: 299.00,
        stock: 15,
        ingredients: '100% Pure Sun-Dried Orange Peel Powder.',
        usage: 'Mix 1 tablespoon with water, milk, or rose water to form a paste. Apply to face, leave for 15 minutes, then rinse gently with lukewarm water.',
        image_url: '/images/orange_peel.png',
        status: 'Published'
    },
    {
        id: 2,
        name: 'Neem Leaf',
        tag: 'PURIFYING',
        category: 'Skin Care',
        description: 'A powerful purifying solution containing organic neem leaf extracts. Renowned for its antibacterial properties, it combats acne, soothes irritation, and deeply cleanses pores.',
        price: 249.00,
        stock: 10,
        ingredients: '100% Organic Neem Leaf Powder, Natural antibacterial agents.',
        usage: 'Mix with water or aloe vera gel. Apply to active acne or the entire face. Let dry for 10-12 minutes, then wash off with cold water.',
        image_url: '/images/neem_leaf.png',
        status: 'Published'
    },
    {
        id: 3,
        name: 'Multani Mitti',
        tag: 'DETOXIFYING',
        category: 'Skin Care',
        description: 'Traditional Fuller Earth clay sourced from nature. It absorbs dirt, toxins, and excess sebum, revitalizing tired skin and refining your skin texture.',
        price: 199.00,
        stock: 12,
        ingredients: 'Pure Multani Mitti (Fullers Earth) clay.',
        usage: 'Mix with rose water (for oily skin) or milk (for dry skin). Apply evenly, allow to dry completely (about 15 minutes), and wash off.',
        image_url: '/images/multani_mitti.png',
        status: 'Published'
    },
    {
        id: 4,
        name: 'Rice Powder',
        tag: 'SOOTHING',
        category: 'Skin Care',
        description: 'Finely milled rice flour that gently exfoliates while soothing sensitive skin. Improves elasticity, brightens overall skin tone, and leaves a silky-smooth finish.',
        price: 229.00,
        stock: 20,
        ingredients: 'Finely ground premium organic rice.',
        usage: 'Mix with honey or curd. Gently massage in circular motions on face/neck, leave as a pack for 10 minutes, and rinse with cold water.',
        image_url: '/images/rice_powder.png',
        status: 'Published'
    },
    {
        id: 5,
        name: 'Ubtan Powder',
        tag: 'RADIANCE',
        category: 'Skin Care',
        description: 'A traditional, premium blend of herbs, turmeric, and sandalwood. Radiates skin naturally, removes tan, and offers a timeless glowing complexion.',
        price: 349.00,
        stock: 8,
        ingredients: 'Turmeric, Sandalwood, Chickpea flour, Rose petals, Neem, Orange peel.',
        usage: 'Mix with milk or rose water. Apply on face/body, massage gently in circular motions, leave for 15-20 minutes, and rinse off.',
        image_url: '/images/ubtan_powder.png',
        status: 'Published'
    },
    {
        id: 6,
        name: 'Chocolate Wax Powder',
        tag: 'HAIR REMOVAL',
        category: 'Body Care',
        description: 'A luxurious, painless wax powder infused with rich cocoa. Offers easy hair removal while brightening and smoothing skin in the comfort of your home.',
        price: 399.00,
        stock: 14,
        ingredients: 'Cocoa powder, natural clay, soothing botanicals.',
        usage: 'Mix powder with water to make a semi-thick paste. Apply on body parts, let it dry for 10-15 minutes, then wipe off in the opposite direction of hair growth with a wet cloth.',
        image_url: '/images/chocolate_wax_powder.png',
        status: 'Published'
    }
];

async function cleanDatabase() {
    console.log('Connecting to MongoDB Atlas Cloud...');
    await mongoose.connect(uri);

    const UserSchema = new mongoose.Schema({}, { strict: false });
    const OrderSchema = new mongoose.Schema({}, { strict: false });
    const ProductSchema = new mongoose.Schema({}, { strict: false });

    const UserModel = mongoose.model('User', UserSchema);
    const OrderModel = mongoose.model('Order', OrderSchema);
    const ProductModel = mongoose.model('Product', ProductSchema);

    // 1. Clear all fake test orders
    const orderDel = await OrderModel.deleteMany({});
    console.log(`[CLEANUP] Deleted test orders count: ${orderDel.deletedCount}`);

    // 2. Clear all non-admin test users
    const adminEmails = ['krishivcorporation4513@gmail.com', 'admin@krishiv.co'];
    const userDel = await UserModel.deleteMany({ email: { $nin: adminEmails } });
    console.log(`[CLEANUP] Deleted non-admin users count: ${userDel.deletedCount}`);

    // 3. Ensure Super Admin User exists
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.pbkdf2Sync('admin123', salt, 1000, 64, 'sha512').toString('hex');

    await UserModel.updateOne(
        { email: 'krishivcorporation4513@gmail.com' },
        { 
            $set: {
                id: 'user-admin-super',
                name: 'Krishiv Corporation Admin',
                email: 'krishivcorporation4513@gmail.com',
                role: 'admin',
                isSuperAdmin: true,
                salt: salt,
                passwordHash: passwordHash,
                provider: 'email',
                created_at: new Date()
            } 
        },
        { upsert: true }
    );
    console.log('[CLEANUP] Super Admin account preserved & seeded in MongoDB Atlas.');

    // 4. Ensure all 6 official products are seeded
    for (const p of mockProducts) {
        await ProductModel.updateOne({ id: p.id }, { $set: p }, { upsert: true });
    }
    const productCount = await ProductModel.countDocuments();
    console.log(`[CLEANUP] Verified ${productCount} official catalog products in MongoDB Atlas.`);

    await mongoose.disconnect();
    console.log('✅ Database successfully purged of all fake test users & orders!');
}

cleanDatabase().catch(err => {
    console.error('Cleanup Error:', err);
    process.exit(1);
});
