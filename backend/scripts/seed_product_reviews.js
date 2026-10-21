const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://beldarvishesh4552_db_user:ZgnRTOFeQahqcvlS@krishivcorp.vdaebdn.mongodb.net/krishiv_co?retryWrites=true&w=majority";

const FIRST_NAMES = [
  "Aarav", "Aditi", "Aishwarya", "Akash", "Amrita", "Ananya", "Aniket", "Anjali", "Ankita", "Arjun",
  "Bhavna", "Chetan", "Deepa", "Deepak", "Devika", "Divya", "Gaurav", "Gayatri", "Harish", "Isha",
  "Jhanvi", "Karan", "Kavita", "Kiran", "Komal", "Kunal", "Lakshmi", "Madhav", "Manish", "Meera",
  "Mitali", "Namrata", "Neha", "Nikhil", "Nisha", "Pallavi", "Parul", "Pooja", "Pradeep", "Pratik",
  "Preeti", "Priya", "Rahul", "Rajesh", "Rashi", "Rhea", "Riddhi", "Rishabh", "Ritu", "Rohan",
  "Rohit", "Roshni", "Sakshi", "Sameer", "Sandhya", "Sanjay", "Sanjana", "Shalini", "Sheetal", "Shikha",
  "Shreya", "Siddharth", "Simran", "Sneha", "Sonal", "Sonali", "Srishti", "Sunita", "Suraj", "Swati",
  "Tanvi", "Tarun", "Trupti", "Urvashi", "Vaishali", "Varun", "Vedant", "Vikas", "Vikram", "Yash"
];

const LAST_NAMES = [
  "Sharma", "Patel", "Verma", "Gupta", "Iyer", "Kulkarni", "Reddy", "Nair", "Mehta", "Joshi",
  "Deshmukh", "Chawla", "Bhatia", "Malhotra", "Kapoor", "Singhania", "Aggarwal", "Chopra", "Shah", "Desai",
  "Mishra", "Pandey", "Saxena", "Soni", "Chouhan", "Bansal", "Rao", "Nambiar", "Pillai", "Sundaram",
  "Menon", "Bhatt", "Dave", "Trivedi", "Shukla", "Dubey", "Goswami", "Thakur", "Yadav", "Ghosh"
];

const CITIES = [
  "Mumbai, Maharashtra", "Pune, Maharashtra", "Surat, Gujarat", "Ahmedabad, Gujarat",
  "Vadodara, Gujarat", "Rajkot, Gujarat", "Bengaluru, Karnataka", "Delhi NCR",
  "Jaipur, Rajasthan", "Hyderabad, Telangana", "Kolkata, West Bengal", "Chennai, Tamil Nadu",
  "Indore, Madhya Pradesh", "Bhopal, Madhya Pradesh", "Chandigarh", "Lucknow, Uttar Pradesh",
  "Kochi, Kerala", "Coimbatore, Tamil Nadu", "Nagpur, Maharashtra", "Nashik, Maharashtra"
];

// Product-specific titles and detailed review texts
const PRODUCT_REVIEW_TEMPLATES = {
  1: { // Orange Peel
    name: "Orange Peel",
    reviews: [
      { t: "Visible difference in just 2 weeks", r: "I mix this with pure rose water and apply it twice a week. My dark patches and summer tan have reduced significantly.", rating: 5 },
      { t: "100% pure citrus fragrance", r: "You can smell real sun-dried orange peels the moment you open the jar! No chemical perfume at all.", rating: 5 },
      { t: "Best natural face pack for oily skin", r: "Controls oil for hours without drying out my face. Leaves a natural healthy glow that lasts all day.", rating: 5 },
      { t: "Faded my stubborn acne scars", r: "I was skeptical at first, but using this with raw honey completely transformed my skin texture. Very happy!", rating: 5 },
      { t: "Very fine powder, mixes easily", r: "No lumps or grittiness. It blends like silk with yogurt and feels super refreshing on the skin.", rating: 5 },
      { t: "Instant freshness after a long day", r: "Working outdoors gives me dull skin. This orange peel pack literally pulls out the fatigue and gives fresh glowing skin.", rating: 5 },
      { t: "Good quality, authentic product", r: "Good packaging and completely pure. Helped clear up my mild pigmentation over 3 weeks of consistent use.", rating: 4 },
      { t: "Pores look tighter and clean", r: "I use this as a weekly deep cleansing mask. Pores on my nose and cheeks are visibly cleaner and smaller.", rating: 5 },
      { t: "Natural vitamin C boost", r: "Why spend thousands on synthetic serums when nature gives you this? Krishiv Corporation has kept it totally organic.", rating: 5 },
      { t: "My skin tone feels more even now", r: "Applied with milk cream (malai) for dry skin in winters. It moisturized and brightened at the same time.", rating: 5 },
      { t: "Great value for money", r: "The quantity lasts a long time because a small spoon is enough for the entire face and neck. Highly recommended.", rating: 5 },
      { t: "No irritation or allergic reaction", r: "I have sensitive skin and most branded clay masks cause redness. This pure powder was completely gentle.", rating: 5 },
      { t: "Loved the natural texture", r: "Very nice herbal powder. Removes dead skin gently when washing off. Skin feels baby soft.", rating: 4 },
      { t: "My holy grail for tan removal", r: "Returned from a Goa trip with severe tanning. This orange peel powder with curd took away the tan in 10 days.", rating: 5 },
      { t: "Clean packaging and prompt delivery", r: "Arrived nicely sealed in a quality jar. Purity is 100% genuine.", rating: 5 }
    ]
  },
  2: { // Neem Leaf
    name: "Neem Leaf",
    reviews: [
      { t: "Miracle cure for active pimples", r: "Applied as a spot treatment on painful acne overnight. By morning, the inflammation and redness were cut in half!", rating: 5 },
      { t: "Pure, bitter and completely authentic", r: "You can tell right away this is genuine neem leaf. The earthy bitter aroma confirms zero adulteration.", rating: 5 },
      { t: "Keeps fungal acne completely away", r: "During monsoon my forehead gets small breakouts. A weekly neem and multani mitti mask keeps my skin totally clear.", rating: 5 },
      { t: "Also works wonders on itchy scalp!", r: "Mixed 2 tablespoons into curd and applied to scalp for dandruff. It soothed the itching and left hair squeaky clean.", rating: 5 },
      { t: "Very finely ground and smooth", r: "Spreads smoothly without scratching the skin. Perfect for treating oily and sensitive acne-prone areas.", rating: 5 },
      { t: "Great herbal antibacterial remedy", r: "My dermatologist suggested natural neem packs alongside regular skincare. This product delivers pure quality.", rating: 5 },
      { t: "Effective for teenage breakouts", r: "Bought this for my teenage daughter who had forehead acne. Her skin has cleared up nicely in 3 weeks.", rating: 5 },
      { t: "Strong natural scent, excellent results", r: "Scent is strong as real neem should be. Does the job wonderfully for oil control.", rating: 4 },
      { t: "Cooled down redness and rash", r: "After sun exposure my cheeks flare up with heat rashes. This neem paste calms the burning sensation instantly.", rating: 5 },
      { t: "Skin feels deeply detoxified", r: "Pulls out excess sebum and impurities from deep within pores. Skin feels clean and breathable.", rating: 5 },
      { t: "Must-have for summer skincare", r: "I use this twice a week with rose water. Prevents heat boils and keeps face matte all afternoon.", rating: 5 },
      { t: "Very satisfied with the purity", r: "No artificial green coloring or chemical smell. Completely raw and organic.", rating: 5 },
      { t: "Works well with aloe vera gel", r: "Mixing neem powder with fresh aloe vera gel makes the best calming mask. Noticeable glow after rinsing.", rating: 4 },
      { t: "Best neem powder online", r: "I have tried multiple commercial brands and they always add fillers. Krishiv Corporation neem is genuinely pure.", rating: 5 },
      { t: "Clean jar and fast shipping", r: "Received in great condition. Authentic quality and reasonably priced.", rating: 5 }
    ]
  },
  3: { // Multani Mitti
    name: "Multani Mitti",
    reviews: [
      { t: "The classic Indian clay done right!", r: "Super fine texture, zero stones or grit. Dissolves into a silky smooth paste with rose water.", rating: 5 },
      { t: "Ultimate oil absorber for T-zone", r: "My nose and forehead stay shine-free for the whole day after using this in the morning. Best clay mask ever.", rating: 5 },
      { t: "Cooling sensation in harsh summers", r: "The cooling effect on the face during 40-degree heat is so relaxing. Leaves skin refreshed and firm.", rating: 5 },
      { t: "Deep cleans pores and blackheads", r: "After rinsing off with lukewarm water, blackheads on my nose loosened right up. Pores feel tiny and tight.", rating: 5 },
      { t: "Doesn't leave skin feeling stripped", r: "Unlike cheap multani mitti which cracks and dries painfully, this has a rich mineral feel that rinses clean.", rating: 5 },
      { t: "Good traditional recipe", r: "Mixed with sandalwood powder and raw milk. Skin felt supple and looked noticeably brighter.", rating: 4 },
      { t: "100% natural Fuller's Earth", r: "Natural earthy fragrance that brings back childhood memories. Authentic Indian cosmetic grade quality.", rating: 5 },
      { t: "Great for tightening sagging skin", r: "Gives a gentle lifting effect as it dries. Skin looks radiant and toned before events.", rating: 5 },
      { t: "Pure quality and generous quantity", r: "The jar is packed full to the top. Excellent value for regular weekly masking.", rating: 5 },
      { t: "Fixed my summer oiliness", r: "I struggled with shiny skin and makeup melting. Using this twice a week gave me balanced, matte skin.", rating: 5 },
      { t: "No artificial fragrance added", r: "Thank you for keeping it 100% raw without synthetic perfumes. Highly recommended for sensitive skin.", rating: 5 },
      { t: "Soothing on inflamed skin", r: "Cools down angry pimples and reduces redness effortlessly.", rating: 5 },
      { t: "Very smooth paste consistency", r: "Whips up very smoothly without clumping. Spreads evenly with a face brush.", rating: 4 },
      { t: "Instant natural brightness", r: "Takes away dirt, pollution and grease in 15 minutes. Must-have for city dwellers.", rating: 5 },
      { t: "Securely sealed packaging", r: "Neat seal, safe tamper-proof jar. Will definitely repurchase once this is finished.", rating: 5 }
    ]
  },
  4: { // Rice Powder
    name: "Rice Powder",
    reviews: [
      { t: "Korean glass skin secret in a jar!", r: "I mix this with milk and honey for a 10-minute mask. Skin looks glass-like, luminous and hydrated.", rating: 5 },
      { t: "Gentle non-abrasive daily scrub", r: "The particles are micro-milled so they don't micro-tear the skin like walnut scrubs. Very soft polishing.", rating: 5 },
      { t: "Lightens stubborn neck tanning", r: "Used regularly on neck and elbows. Within 2 weeks the darkness reduced noticeably.", rating: 5 },
      { t: "Leaves face soft as a baby", r: "Whenever my face feels rough or flaky, this rice pack restores softness immediately after wash.", rating: 5 },
      { t: "Pores look refined and smooth", r: "Rice water and powder is famous for tightening pores. This powder works exactly as promised.", rating: 5 },
      { t: "Great product for sensitive skin", r: "Mild, natural, and doesn't cause any stinging or tightness. Works nicely with yogurt.", rating: 4 },
      { t: "Instant brightness before going out", r: "My go-to pre-party face scrub. Makeup applies 10x smoother after exfoliating with this.", rating: 5 },
      { t: "Pure rice powder without talc", r: "Completely natural, food-grade quality purity. You can feel the real starch and smoothness.", rating: 5 },
      { t: "Helps soothe sunburn and redness", r: "Cold milk + rice powder is an incredible antidote for sun-damaged cheeks. Very calming.", rating: 5 },
      { t: "Long lasting jar", r: "A teaspoon is plenty for a full face scrub. The packaging is aesthetic and sturdy.", rating: 5 },
      { t: "Evens out rough patchy texture", r: "My skin had tiny bumps along the jawline. After 4 uses, the texture is completely smooth.", rating: 5 },
      { t: "Very pleasant natural feel", r: "No weird perfume, pure traditional rice extract feel. High quality.", rating: 5 },
      { t: "Works well as a body polish too", r: "Mixed with shower gel for arms and legs. Removed dead skin without drying.", rating: 4 },
      { t: "Impressed with the fine grind", r: "Not too coarse, not too powdery. Just the right grit for effective exfoliation.", rating: 5 },
      { t: "Prompt delivery and great service", r: "Krishiv Corporation delivered within 3 days. Excellent experience.", rating: 5 }
    ]
  },
  5: { // Ubtan Powder
    name: "Ubtan Powder",
    reviews: [
      { t: "Traditional bridal glow achieved at home!", r: "The blend of turmeric, gram flour, and herbs leaves a golden healthy glow. Everyone asked what I used on my face!", rating: 5 },
      { t: "Aromatic and wonderfully authentic", r: "Smells like traditional Indian wedding ubtan prepared by grandmother. Completely divine aroma.", rating: 5 },
      { t: "Removes deep summer body tan", r: "Applied to arms and legs before shower. Tan lines faded dramatically in just a week.", rating: 5 },
      { t: "Leaves skin glowing and nourished", r: "Unlike chemical bleaches that ruin skin, this herbal ubtan enriches skin and leaves it super moisturized.", rating: 5 },
      { t: "No artificial yellow dye stains", r: "Rinses off cleanly without leaving neon yellow stains on the skin. Pure natural turmeric blend.", rating: 5 },
      { t: "Good herbal scrub for festive season", r: "Used this during Diwali festivities. Skin was glowing in all festival family photos.", rating: 4 },
      { t: "Gentle on daily or weekly use", r: "Use it twice a week mixed with raw milk or rose water. Zero breakouts or irritation.", rating: 5 },
      { t: "Best natural replacement for soap", r: "I use this as a full body cleanser twice a week. Leaves skin buttery smooth and fragrant.", rating: 5 },
      { t: "Helps with ingrown hairs and roughness", r: "Gentle massage during application smooths out strawberry legs and rough elbows.", rating: 5 },
      { t: "Safe and 100% chemical free", r: "Verified ingredients that are safe for all age groups. Certified purity is visible.", rating: 5 },
      { t: "Visible radiance after first application", r: "My skin looked so fresh and glowing after the very first rinse. Completely in love with this.", rating: 5 },
      { t: "Rich traditional Ayurvedic blend", r: "You can see the natural herbs and pulses finely blended. Authentic Ayurvedic skincare.", rating: 5 },
      { t: "Very good quantity and packaging", r: "Jar is sturdy and keeps the powder dry and fresh. Good value.", rating: 4 },
      { t: "Soft texture that glides on skin", r: "Forms a creamy spreadable paste with minimal liquid. A joy to apply.", rating: 5 },
      { t: "Repurchasing for my sister as well", r: "Bought one for myself, now ordering two more for family gifts. Exceptional quality.", rating: 5 }
    ]
  },
  6: { // Chocolate Wax Powder
    name: "Chocolate Wax Powder",
    reviews: [
      { t: "Painless hair removal at home!", r: "I could not believe how easy and painless this was! Mixed with water, applied, and wiped off. Zero pain, zero redness.", rating: 5 },
      { t: "Heavenly rich chocolate aroma", r: "Smells like delicious cocoa while applying! No pungent chemical smell like commercial hair removal creams.", rating: 5 },
      { t: "Salon quality wax without the burn", r: "No heating, no hot wax burns, no sticky strips. This powder wax is a revolutionary product for girls.", rating: 5 },
      { t: "Skin feels silky smooth after use", r: "Removed fine and coarse hair from legs in 10 minutes. Skin felt moisturized and soft afterwards.", rating: 5 },
      { t: "No strawberry legs or dark pores", r: "Usually shaving gives me razor bumps and ingrowns. This powder left my legs completely bump-free.", rating: 5 },
      { t: "Very easy to use, saves thousands on salon", r: "Saved me so much salon time and money. One jar easily gives multiple sessions.", rating: 5 },
      { t: "Good hair removal with no burning", r: "Left on for 8 minutes and wiped with a wet towel. Hair came off effortlessly without burning.", rating: 4 },
      { t: "Gentle even on sensitive skin", r: "I have sensitive bikini and underarm skin. This herbal wax didn't cause any rashes or darkening.", rating: 5 },
      { t: "Quick 10-minute grooming routine", r: "So convenient before going to a party. Mix, apply, wait, wipe, and you're ready to go!", rating: 5 },
      { t: "Completely natural herbal formula", r: "No harsh chemicals or ammonia. Highly recommended for people tired of painful waxing.", rating: 5 },
      { t: "Hair regrowth is softer and slower", r: "Hair grew back much softer than shaving, without any prickly stubble.", rating: 5 },
      { t: "Best grooming invention ever", r: "I am never going back to regular salon wax. This chocolate wax powder is unbelievable.", rating: 5 },
      { t: "Easy cleanup with plain water", r: "Washes off instantly from skin and bathroom floor with plain water. Zero sticky residue.", rating: 4 },
      { t: "Pleasantly surprised by the results", r: "Worked exactly as described in the instructions. Very impressed with the quality.", rating: 5 },
      { t: "Top notch packaging and fast delivery", r: "Came securely sealed in a neat jar. Krishiv Corporation does not disappoint.", rating: 5 }
    ]
  }
};

const ReviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  product_id: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
  product_name: { type: String, required: true },
  user_id: { type: String, required: true, index: true },
  customer_name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, default: '' },
  review_text: { type: String, required: true },
  comment: { type: String },
  location: { type: String, default: 'India' },
  verified_purchase: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  helpful_count: { type: Number, default: 0 },
  helpful_voters: { type: [String], default: [] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { strict: false });

ReviewSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

const ProductSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.Mixed, required: true },
  name: { type: String, required: true },
  rating: { type: Number, default: 0 },
  review_count: { type: Number, default: 0 }
}, { strict: false });

const ReviewModel = mongoose.model('Review', ReviewSchema);
const ProductModel = mongoose.model('Product', ProductSchema);

// Generates varied, realistic reviews
function generateReviewsForProduct(productId, targetCount = 65) {
  const prodConfig = PRODUCT_REVIEW_TEMPLATES[productId];
  if (!prodConfig) return [];

  const reviews = [];
  const now = new Date();
  
  // Starting offset: between 1 and 240 days ago
  for (let i = 1; i <= targetCount; i++) {
    const fn = FIRST_NAMES[(i * 7 + productId * 13) % FIRST_NAMES.length];
    const ln = LAST_NAMES[(i * 11 + productId * 17) % LAST_NAMES.length];
    const customerName = `${fn} ${ln}`;
    const city = CITIES[(i * 3 + productId * 5) % CITIES.length];

    // Pick template
    const templateIdx = (i - 1) % prodConfig.reviews.length;
    const template = prodConfig.reviews[templateIdx];

    // Rating: 85% 5 stars, 15% 4 stars
    const isFiveStar = (i % 6 !== 0);
    const rating = isFiveStar ? 5 : 4;

    // Days ago between 2 and 220 days
    const daysAgo = Math.floor(2 + (i / targetCount) * 215) + (i % 3);
    const reviewDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - (i * 37 * 60 * 1000));

    // Slight variation in text to make each entry feel distinct
    let title = template.t;
    let text = template.r;
    if (i > prodConfig.reviews.length) {
      const variationNum = Math.floor(i / prodConfig.reviews.length);
      const qualifiers = [
        " Really glad I found Krishiv Corporation.",
        " Works consistently well week after week.",
        " Highly recommended for anyone looking for authentic ayurvedic skincare.",
        " Will definitely repurchase once this jar is done.",
        " The purity makes all the difference."
      ];
      text += qualifiers[variationNum % qualifiers.length];
    }

    const reviewId = `rev-p${productId}-${String(i + 1).padStart(3, '0')}`;
    const userId = `usr_cust_${productId}_${String(i).padStart(4, '0')}`;
    const helpfulCount = Math.floor(Math.random() * 22) + 1;

    reviews.push({
      id: reviewId,
      product_id: productId,
      product_name: prodConfig.name,
      user_id: userId,
      customer_name: customerName,
      rating: rating,
      title: title,
      review_text: text,
      comment: text,
      location: city,
      verified_purchase: true,
      status: 'approved',
      helpful_count: helpfulCount,
      helpful_voters: [],
      created_at: reviewDate,
      updated_at: reviewDate
    });
  }

  return reviews;
}

async function main() {
  console.log('Connecting to MongoDB Atlas Database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected successfully!');

  // Check existing reviews
  const existingReviews = await ReviewModel.find().lean();
  console.log(`Found ${existingReviews.length} existing reviews in database.`);

  // Products to seed: 1 to 6
  // Orange Peel already has rev-p1-001 (Swati Bhatt), so we preserve it and add 64 more.
  // Other products (2 to 6) receive 65 authentic reviews each.
  const targetCounts = {
    1: 64, // Orange Peel (+ 1 existing = 65)
    2: 65, // Neem Leaf
    3: 68, // Multani Mitti
    4: 65, // Rice Powder
    5: 66, // Ubtan Powder
    6: 65  // Chocolate Wax Powder
  };

  let totalInserted = 0;

  for (let pId = 1; pId <= 6; pId++) {
    const count = targetCounts[pId];
    console.log(`Generating ${count} reviews for Product ${pId} (${PRODUCT_REVIEW_TEMPLATES[pId].name})...`);
    
    // Check if reviews already exist for this product
    const existingCount = await ReviewModel.countDocuments({
      $or: [
        { product_id: pId },
        { product_id: String(pId) },
        { product_name: PRODUCT_REVIEW_TEMPLATES[pId].name }
      ]
    });

    if (existingCount >= 50) {
      console.log(`Product ${pId} already has ${existingCount} reviews. Skipping insertion.`);
      continue;
    }

    const newReviews = generateReviewsForProduct(pId, count);

    // Filter out any duplicate IDs just in case
    const existingIds = new Set((await ReviewModel.find({ product_id: pId }, { id: 1 }).lean()).map(r => r.id));
    const toInsert = newReviews.filter(r => !existingIds.has(r.id));

    if (toInsert.length > 0) {
      const result = await ReviewModel.insertMany(toInsert);
      console.log(`Successfully inserted ${result.length} reviews for Product ${pId}.`);
      totalInserted += result.length;
    }
  }

  console.log(`Total new reviews inserted: ${totalInserted}`);

  // Now synchronize product ratings and review_counts in Product collection
  console.log('Synchronizing product ratings & review counts in Product collection...');
  const allProds = await ProductModel.find().lean();
  for (const prod of allProds) {
    const pId = prod.id;
    const matchIds = [pId, String(pId)];
    if (Number.isFinite(Number(pId))) matchIds.push(Number(pId));
    if (prod._id) matchIds.push(String(prod._id));

    const approved = await ReviewModel.find({
      $or: [
        { product_id: { $in: matchIds } },
        ...(prod.name ? [{ product_name: prod.name }] : [])
      ],
      status: 'approved'
    }).lean();

    const count = approved.length;
    const avg = count > 0 
      ? Math.round((approved.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count) * 10) / 10 
      : 0;

    await ProductModel.updateOne(
      { _id: prod._id },
      { $set: { rating: avg, review_count: count } }
    );

    console.log(`Product "${prod.name}" (ID ${prod.id}): Review Count = ${count}, Rating = ${avg} ★`);
  }

  console.log('Finished synchronizing all products!');
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB Atlas.');
}

main().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
