const fs = require('fs');
const path = require('path');

const firstNames = [
  'Priya', 'Ananya', 'Sneha', 'Pooja', 'Ritu', 'Neha', 'Kavita', 'Deepika', 'Meera', 'Shreya',
  'Tanvi', 'Divya', 'Simran', 'Payal', 'Manisha', 'Urvashi', 'Trisha', 'Swati', 'Kunjal', 'Komal',
  'Mansi', 'Vandana', 'Dimple', 'Bhavna', 'Hetal', 'Vidhi', 'Kruti', 'Bhumika', 'Nisha', 'Kinjal',
  'Hina', 'Radhika', 'Aarav', 'Rajesh', 'Rohan', 'Bhavik', 'Jignesh', 'Varun', 'Alok', 'Hemal',
  'Chirag', 'Harsh', 'Sanjay', 'Rakesh', 'Parth', 'Nitin', 'Mayur', 'Yash', 'Chetan', 'Darshan',
  'Tejas', 'Amit', 'Pranav', 'Gaurav', 'Manish', 'Kunal', 'Devanshi', 'Aayushi', 'Prachi', 'Khushboo',
  'Roshni', 'Isha', 'Ishita', 'Dharti', 'Falguni', 'Riddhi', 'Siddhi', 'Ankita', 'Bhakti', 'Charmi',
  'Drashti', 'Esha', 'Janki', 'Maitri', 'Namrata', 'Pallavi', 'Reema', 'Saloni', 'Toral', 'Zeel'
];

const lastNames = [
  'Patel', 'Shah', 'Mehta', 'Desai', 'Joshi', 'Sharma', 'Verma', 'Gupta', 'Trivedi', 'Rathod',
  'Dave', 'Bhatt', 'Gandhi', 'Chopra', 'Malhotra', 'Agarwal', 'Pandey', 'Shukla', 'Iyer', 'Nair',
  'Kulkarni', 'Somani', 'Modi', 'Vora', 'Bansal', 'Singhania', 'Goyal', 'Chauhan', 'Solanki', 'Mishra',
  'Saxena', 'Gada', 'Soni', 'Thakkar', 'Kotak', 'Panchal', 'Gajjar', 'Prajapati', 'Makwana', 'Chaudhary'
];

const cities = [
  'Surat, Gujarat', 'Ahmedabad, Gujarat', 'Vadodara, Gujarat', 'Rajkot, Gujarat', 'Mumbai, Maharashtra',
  'Pune, Maharashtra', 'Delhi, NCR', 'Bangalore, Karnataka', 'Jaipur, Rajasthan', 'Indore, Madhya Pradesh',
  'Hyderabad, Telangana', 'Gandhinagar, Gujarat', 'Bhavnagar, Gujarat', 'Kolkata, West Bengal', 'Lucknow, Uttar Pradesh',
  'Chandigarh, Punjab', 'Nagpur, Maharashtra', 'Nashik, Maharashtra', 'Udaipur, Rajasthan', 'Bhopal, Madhya Pradesh'
];

// Product-specific review templates
const productReviewTemplates = {
  1: {
    // Orange Peel
    targetCount: 82,
    product_name: 'Orange Peel',
    headlines5: [
      'Amazing natural citrus glow!',
      'Best orange peel powder I have ever used',
      'Visible tan removal from the first use',
      'Very fine powder with pure citrus smell',
      'Faded my dark spots in just 3 weeks',
      '100% genuine and organic quality',
      'Goodbye oily face and dullness',
      'Refreshing and gives radiant skin',
      'Pure sun-dried goodness, no artificial chemicals',
      'My holy grail face pack for summers',
      'Much better than expensive chemical serums',
      'Skin feels soft, smooth, and naturally bright',
      'Perfect for daily skin detox',
      'Instant freshness and natural vitamin C boost',
      'Great texture and blends easily with rose water',
      'Cleared my mild acne marks nicely',
      'Loved the authentic fragrance of pure oranges',
      'Gentle on sensitive skin, does not cause redness',
      'Best for tan removal after beach vacation',
      'A must-have herbal skincare staple'
    ],
    comments5: [
      'I mix 1 spoon of this Orange Peel powder with rose water twice a week. The glow it leaves on my face is instant and natural! No harsh chemicals at all.',
      'Usually store-bought powders have coarse particles, but Krishiv Corporation orange peel is micro-fine and feels so soothing on skin. Tan removed within two washes.',
      'The scent alone proves how pure it is—smells like genuine fresh sun-dried orange peels. It reduced my forehead pigmentation significantly.',
      'I have oily, acne-prone skin and this keeps excess sebum in control without over-drying my face. Truly a 5-star product!',
      'Used this for my pre-wedding glow mixed with raw milk. Everyone complimented my radiant skin tone! Highly recommend.',
      'Been using it for 3 weeks consistently. My stubborn dark spots from sun exposure have visibly lightened. Very happy with the purchase.',
      'Super easy to use. I mix it with aloe vera gel and honey. My skin looks plump, refreshed, and healthy every morning.',
      'Packaging was secure and eco-friendly. The powder is 100% natural with no added colors or artificial scents. Worth every rupee.',
      'My mother and I both use it regularly. Works wonders for both mature skin and youthful skin. Krishiv Corporation always delivers top quality.',
      'Great formulation! High vitamin C content definitely shows in the brightness and clarity of the complexion.',
      'Removed my dullness after travelling under harsh sun. It acts as a gentle exfoliant without tearing the skin barrier.',
      'The best organic cosmetic purchase this year. Clean ingredients, authentic Ayurvedic processing, and wonderful results.',
      'I love that it does not dry out my cheeks while still balancing my T-zone oiliness. Excellent product.',
      'Skin texture became remarkably smooth after 4 applications. Will definitely reorder when this jar finishes.',
      'Safe, natural, and potent. You can feel the purity the moment you open the jar.'
    ],
    headlines4: [
      'Very good quality, takes a few days for results',
      'Genuine orange powder, slightly tingles initially',
      'Effective tan removal and nice citrus smell',
      'Good herbal product, recommend using with milk'
    ],
    comments4: [
      'High quality pure orange peel powder. If you have dry skin, make sure to mix with milk or honey rather than just plain water. Great results overall.',
      'Mild natural tingling on first use due to natural vitamin C, but settles quickly and leaves skin glowing. Delivered on time.',
      'Good authentic product. Clean packaging. Took around two weeks of regular use to see clear reduction in sun tan.',
      'Really nice product. Leaves a pleasant orange scent and subtle glow. Would like a bigger family pack option too.'
    ]
  },
  2: {
    // Neem Leaf
    targetCount: 74,
    product_name: 'Neem Leaf',
    headlines5: [
      'Cleared my stubborn hormonal breakouts!',
      'Purity you can smell and feel',
      'Best natural solution for active acne',
      'Soothes irritated red skin overnight',
      'Pure organic neem with zero chemicals',
      'Controls oiliness like magic',
      'Pores look cleaner and refined',
      'A lifesaver for monsoon skin infections',
      'Real neem leaves crushed to fine perfection',
      'Calms cystic bumps without drying out skin',
      'Miracle powder for sensitive oily skin',
      'My dermatologist approved natural remedy',
      'Excellent for scalp dandruff and face packs',
      'Deep purifying effect after long work days',
      'Effective antibacterial herbal treatment'
    ],
    comments5: [
      'I was struggling with persistent pimples for months. Applied this neem leaf paste mixed with rose water every alternate night, and within 10 days my breakouts dried up without dark spots!',
      'You can instantly recognize the bitter, herbal purity of real neem. No synthetic green dyes or added perfumes. Pure Ayurvedic power.',
      'Works wonders as a spot treatment! I apply a small dab directly on emerging pimples and they reduce by morning.',
      'My skin produces excess oil during humid weather. This neem mask balances oil production completely while calming redness.',
      'I also mixed a spoonful in coconut oil for scalp itchiness and dandruff—it worked like a charm! Multi-purpose herbal remedy.',
      'Extremely gentle yet powerful. Cleans deep into pores to pull out accumulated grime and pollution.',
      'After trying several expensive salicylic acid cleansers that ruined my moisture barrier, this natural neem powder healed my skin.',
      'Excellent texture. It blends smoothly with aloe vera gel to create a cooling calming mask.',
      'Clean sourcing, fast delivery, and authentic results. My acne scars are fading nicely with regular application.',
      'Authentic certified organic product. If you have oily or breakout-prone skin, this is an absolute must-have in your cabinet.',
      'My teenager son uses this twice a week for acne and the improvement in his complexion has been dramatic.',
      'No burning sensation, only soothing Ayurvedic comfort. Very satisfied with Krishiv Corporation.'
    ],
    headlines4: [
      'Very effective for pimples, strong herbal scent',
      'Good quality, use with caution if skin is very dry',
      'Works well on acne, tastes bitter if it gets near lips',
      'Helpful for oily skin, took a week to show effect'
    ],
    comments4: [
      'True neem is naturally bitter and earthy, which shows it is unadulterated. Dries out pimples effectively. Make sure to moisturize well afterwards.',
      'Effective on breakouts. My skin feels clean and fresh. Remember to patch test if you have hyper-reactive skin.',
      'Good pure neem powder. Fast dispatch by Krishiv Corporation. Works better when mixed with yogurt or aloe.',
      'Noticeable reduction in face redness after 5 days. Very happy with the natural ingredients.'
    ]
  },
  3: {
    // Multani Mitti
    targetCount: 91,
    product_name: 'Multani Mitti',
    headlines5: [
      'Super fine clay, zero pebbles or grit!',
      'Cooling and detoxifying, feels like a luxury spa',
      'The purest Fuller’s Earth in the market',
      'Tightens pores and removes blackheads naturally',
      'Summer holy grail for glowing clear skin',
      'Extremely smooth texture, glides on skin',
      'Best Multani Mitti I have ever bought online',
      'Absorbs oil completely without parching skin',
      'Leaves skin squeaky clean and refreshed',
      'Traditional quality at its very best',
      'Instant cooling relief from sun heat',
      'Skin looks glowing and poreless',
      'Pairs perfectly with rose water and sandalwood',
      'Unmatched purity and traditional processing',
      'Grandmother approved quality!'
    ],
    comments5: [
      'Most multani mitti powders in the market have rough gritty sand particles, but Krishiv Corporation is silky smooth like satin! Blends effortlessly into a creamy face mask.',
      'Nothing beats this clay pack during peak Indian summers. It cools down facial heat, clears sun tan, and shrinks enlarged pores.',
      'I make a weekly face mask with raw milk, honey, and this Multani Mitti. My face looks radiant, bright, and so soft!',
      'Remarkable oil absorption! My makeup sits so smoothly on days after I use this mask because the excess sebum is gone.',
      'You get a generous quantity and the purity is exceptional. Feels like stepping out of a high-end Ayurvedic retreat.',
      'Helped clear tiny clogged forehead bumps within 2 weeks. Very clean, unadulterated earth clay.',
      'Even my grandmother praised the authentic quality of this clay. Reminds her of old traditional earth packs.',
      'Airtight packaging kept the powder completely dry and fresh. Very happy with Krishiv Corporation service.',
      'Tightens loose skin and gives a natural firming sensation as it dries. Rinses off cleanly leaving glowing skin.',
      'Excellent value for money. 100% natural, ethical, and superior quality compared to commercial brands.',
      'My skin feels so refreshed and detoxified after every application. A staple in my Sunday self-care routine.',
      'Zero synthetic additives. Gentle on the skin and washes away with plain lukewarm water.'
    ],
    headlines4: [
      'Great smooth clay, do not let it overdry',
      'Good authentic Fullers Earth, very absorbent',
      'High quality clay, excellent for oily T-zones',
      'Fine texture and cools down skin nicely'
    ],
    comments4: [
      'Very pure Fuller\'s Earth clay. Make sure to rinse off when it is 80% dry so it does not pull too much moisture from dry cheeks. Great result.',
      'Nice cooling effect. The clay is very finely sifted. Good delivery and packaging from the store.',
      'Clean and natural. Works really well for absorbing excess oil during humid weather.',
      'Happy with the purchase. Skin feels clean and detoxified after every wash.'
    ]
  },
  4: {
    // Rice Powder
    targetCount: 68,
    product_name: 'Rice Powder',
    headlines5: [
      'Gives that Korean glass-skin glow naturally!',
      'Finest gentle exfoliant ever',
      'Softest skin texture in just one week',
      'Brightens skin tone beautifully',
      'Super gentle scrub, does not hurt skin barrier',
      'Blends like a dream with honey and curd',
      'My skin feels like baby skin after every wash',
      'Removed dullness and rough patches',
      'Traditional rice water beauty secret in powder form',
      'Evened out my patchy skin tone',
      'Gentle enough for everyday skin polishing',
      'Natural, soothing, and leaves skin luminous',
      'Must-have for anyone seeking radiant glass skin',
      'High quality organic rice flour formulation'
    ],
    comments5: [
      'I mix this Rice Powder with curd and a pinch of turmeric. It gives that luminous Korean glass-skin effect without buying expensive imported cosmetics!',
      'The grain size is so finely milled that it exfoliates dead cells without causing micro-tears or irritation. Leaves skin incredibly soft.',
      'My skin used to have rough flaky patches around the nose and mouth. After using this gentle scrub twice, my face is baby-smooth!',
      'Helps my moisturizer and serum absorb twice as fast. Gives an immediate glowing look before heading out.',
      'I was skeptical about rice powder scrubs, but Krishiv Corporation quality blew me away. Truly organic and chemical-free.',
      'Skin feels refined and velvety. Doesn’t strip natural moisture at all.',
      'Excellent for tan removal on arms, neck, and face. Gentle and very effective.',
      'Blends effortlessly into a rich creamy paste. The texture is so pleasant and calming on sensitive skin.',
      'Noticeable brightening effect after just 4 applications. Highly satisfied customer.',
      'Affordable luxury for everyday skincare. Pure ingredients that deliver visible results.'
    ],
    headlines4: [
      'Gentle scrub, works best mixed with curd',
      'Good soothing powder, leaves skin soft',
      'Nice brightening scrub, gentle on face',
      'Good quality, very fine grain size'
    ],
    comments4: [
      'Very gentle and safe physical exfoliant. I recommend mixing with curd or honey for deep nourishment while scrubbing.',
      'Delivered in good condition. Texture is smooth and does not scratch. Skin feels clean and refreshed.',
      'Good product for regular use. Brightens gradually with continuous weekly application.',
      'Satisfied with the organic formulation. Safe for sensitive skin types.'
    ]
  },
  5: {
    // Ubtan Powder
    targetCount: 88,
    product_name: 'Ubtan Powder',
    headlines5: [
      'The ultimate bridal glow in a jar!',
      'Authentic Ayurvedic blend, smells heavenly of sandalwood',
      'Removes deep stubborn tan like magic',
      'Pure turmeric and herbs without staining skin yellow',
      'Left my skin glowing for my cousin’s wedding',
      'Traditional royal ubtan recipe at its finest',
      'Noticeable radiance from the very first wash',
      'Replaced all my expensive salon facial packs',
      'Exquisite herbal aroma and velvety texture',
      'Soft, glowing, and radiant skin naturally',
      'No harsh chemicals, 100% authentic herbal goodness',
      'The best Ubtan available in India right now',
      'Gave my complexion an even, luminous glow',
      'Perfect traditional skincare remedy for festivals'
    ],
    comments5: [
      'This Ubtan is perfection! The fragrance of sandalwood, rose, and turmeric takes you straight to a royal Ayurvedic spa. Left my skin radiant without staining yellow.',
      'Used this for 2 weeks leading up to my engagement ceremony. The natural glow on my face was so radiant that even my makeup artist asked about my routine!',
      'Removed years of stubborn tanning from my arms and neck within a few uses. Mixed with raw milk, it feels like pure silk.',
      'The balance of ingredients is masterful. Doesn’t leave any yellowish stain like homemade haldi packs do, just pure golden radiance.',
      'I’ve tried Ubtans from top luxury Ayurvedic brands, but Krishiv Corporation Ubtan is far more authentic and freshly ground.',
      'Gentle circular massage with this Ubtan removes dead skin cells effortlessly while deeply conditioning the skin.',
      'My entire family uses it before festive celebrations. Safe for all age groups and skin types.',
      'Leaves a lingering soothing botanical aroma. My skin feels nourished, firm, and glowing all day long.',
      'Packed with genuine Ayurvedic herbs. Clean processing and premium quality that you can immediately verify.',
      'Must-buy for anyone looking for that timeless Indian festive glow. 10/10 recommendation!'
    ],
    headlines4: [
      'Very fragrant and glowing, best with raw milk',
      'Good traditional ubtan, gentle on skin',
      'Effective tan remover, smells great',
      'High quality blend, arrived quickly'
    ],
    comments4: [
      'Very rich blend of turmeric, sandalwood, and herbs. Gives a warm natural glow. Best results when used with cold raw milk.',
      'Good natural product. Smells great and removes light tanning effectively after 3-4 uses.',
      'Authentic herbal mixture. Easy to wash off and does not leave a greasy residue.',
      'Happy with the quality. Leaves skin clean, soft, and lightly scented.'
    ]
  },
  6: {
    // Chocolate Wax Powder
    targetCount: 76,
    product_name: 'Chocolate Wax Powder',
    headlines5: [
      'Completely PAINLESS hair removal at home!',
      'Smells like delicious rich dark chocolate',
      'No messy hot wax burns or sticky salon pain',
      'Left my legs silky smooth without strawberry dots',
      'Saved me thousands in parlor waxing bills',
      'Super easy 10-minute application',
      'Wipes off effortlessly with a damp towel',
      'Best waxing innovation I have ever discovered',
      'Zero skin irritation, ingrown hairs, or redness',
      'Painless, clean, and smooth results every time',
      'Saves so much time and discomfort',
      'Salon-quality finish in the comfort of home',
      'Gentle on sensitive bikini line and underarms',
      'My friends are all ordering this now!'
    ],
    comments5: [
      'I was so terrified of regular hot wax burns and waxing strips. This chocolate wax powder is unbelievable—you just mix with water, wait 10 minutes, and wipe with a wet cloth! Zero pain and 100% hair gone!',
      'The rich chocolate aroma makes it feel like an expensive cocoa spa treatment. My skin is moisturized and buttery smooth afterwards.',
      'No strawberry legs, no red bumps, no ingrown hair. Completely painless hair removal without peeling off your skin layer.',
      'I have very sensitive skin that usually breaks into hives after salon wax. With this herbal cocoa wax, not a single bump appeared!',
      'Takes less than 15 minutes for both full arms. Wipes off cleanly with a wet towel and washes away with plain water.',
      'Hands down the best beauty investment. Saved me so much money and awkward salon appointments.',
      'Removes even short stubborn hair from roots cleanly. Hair regrowth is also much softer and thinner.',
      'Packaging is spill-proof and convenient. Highly recommended for every woman looking for pain-free smooth skin.',
      'I will never go back to regular parlor waxing again. Krishiv Corporation created an absolute game changer!',
      'Gentle formulation that leaves skin bright, tanned-free, and delightfully fragranced.'
    ],
    headlines4: [
      'Works really well, make sure consistency is right',
      'Painless and smooth, wipe firmly against hair',
      'Nice chocolate smell, easy to use at home',
      'Good alternative to hot wax, takes 12-15 minutes'
    ],
    comments4: [
      'Painless hair removal that actually works. Just remember to mix it to a medium toothpaste consistency and wipe firmly with a damp cotton cloth.',
      'Great product. No burns or sticky mess. Pleasant chocolate fragrance and leaves skin soft.',
      'Good gentle formulation. Works best on body hair. Much better than salon hot waxing pain.',
      'Delivered promptly. Clean results without skin irritation.'
    ]
  }
};

const allReviews = [];

for (const [productIdStr, cfg] of Object.entries(productReviewTemplates)) {
  const pId = Number(productIdStr);
  const target = cfg.targetCount;
  
  // Decide how many 5 stars vs 4 stars (mostly 5 stars ~ 85-90%)
  const count4 = Math.floor(target * (0.08 + Math.random() * 0.06));
  const count5 = target - count4;
  
  const reviewsForProduct = [];
  
  for (let i = 0; i < target; i++) {
    const is5Star = i < count5;
    const rating = is5Star ? 5 : 4;
    const headlinePool = is5Star ? cfg.headlines5 : cfg.headlines4;
    const commentPool = is5Star ? cfg.comments5 : cfg.comments4;
    
    const fn = firstNames[(pId * 17 + i * 3) % firstNames.length];
    const ln = lastNames[(pId * 11 + i * 7) % lastNames.length];
    const city = cities[(pId * 5 + i * 2) % cities.length];
    
    const headline = headlinePool[i % headlinePool.length];
    const baseComment = commentPool[i % commentPool.length];
    
    // Slight variation for uniqueness
    let comment = baseComment;
    if (i >= commentPool.length) {
      const suffixes = [
        ' Will definitely recommend to friends and family!',
        ' Definitely worth buying again.',
        ' Extremely satisfied with the fast delivery as well.',
        ' Krishiv Corporation is now my go-to Ayurvedic brand.',
        ' Thank you for maintaining such high quality and purity.'
      ];
      comment = baseComment + suffixes[i % suffixes.length];
    }
    
    // Spread dates over the last 180 days (from Oct 2026 backwards)
    const daysAgo = Math.floor(1 + (i * 179) / target);
    const reviewDate = new Date(Date.now() - daysAgo * 86400000 - ((i * 3719) % 3600000));
    
    const helpfulCount = Math.floor(4 + ((i * 13) % 42));
    
    const revObj = {
      id: `rev-p${pId}-${String(i + 1).padStart(3, '0')}`,
      product_id: pId,
      product_name: cfg.product_name,
      customer_name: `${fn} ${ln}`,
      rating: rating,
      title: headline,
      comment: comment,
      location: city,
      verified_purchase: true,
      status: 'approved',
      helpful_count: helpfulCount,
      created_at: reviewDate.toISOString()
    };
    
    reviewsForProduct.push(revObj);
    allReviews.push(revObj);
  }
}

console.log(`Generated total ${allReviews.length} reviews across ${Object.keys(productReviewTemplates).length} products.`);

for (const [pId, cfg] of Object.entries(productReviewTemplates)) {
  const pReviews = allReviews.filter(r => r.product_id === Number(pId));
  const fiveStars = pReviews.filter(r => r.rating === 5).length;
  const fourStars = pReviews.filter(r => r.rating === 4).length;
  const avg = (pReviews.reduce((sum, r) => sum + r.rating, 0) / pReviews.length).toFixed(1);
  console.log(`- Product #${pId} (${cfg.product_name}): ${pReviews.length} reviews (${fiveStars} 5★, ${fourStars} 4★) -> Avg Rating: ${avg}/5.0`);
}

const outPath = path.join(__dirname, '../data/seedReviews.json');
fs.writeFileSync(outPath, JSON.stringify(allReviews, null, 2), 'utf-8');
console.log(`Saved seed reviews to ${outPath}`);
