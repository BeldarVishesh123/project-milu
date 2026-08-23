-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    provider VARCHAR(50) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tag VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    ingredients TEXT,
    usage TEXT,
    image_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create cart table
CREATE TABLE IF NOT EXISTS cart (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    items JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial products (the only 5 products in the anime.js file)
INSERT INTO products (name, tag, category, description, price, ingredients, usage, image_url)
VALUES
('Orange Peel', 'BRIGHTENING', 'Skin Care', 'A rich, brightening formulation made from sun-dried orange peels. Naturally high in Vitamin C, it reduces dark spots, controls excess oil, and gives your skin a vibrant glow.', 299.00, '100% Pure Sun-Dried Orange Peel Powder.', 'Mix 1 tablespoon with water, milk, or rose water to form a paste. Apply to face, leave for 15 minutes, then rinse gently with lukewarm water.', '/images/orange_peel.png'),

('Neem Leaf', 'PURIFYING', 'Skin Care', 'A powerful purifying solution containing organic neem leaf extracts. Renowned for its antibacterial properties, it combats acne, soothes irritation, and deeply cleanses pores.', 249.00, '100% Organic Neem Leaf Powder, Natural antibacterial agents.', 'Mix with water or aloe vera gel. Apply to active acne or the entire face. Let dry for 10-12 minutes, then wash off with cold water.', '/images/neem_leaf.png'),

('Multani Mitti', 'DETOXIFYING', 'Skin Care', 'Traditional Fuller''s Earth clay sourced from nature. It absorbs dirt, toxins, and excess sebum, revitalizing tired skin and refining your skin texture.', 199.00, 'Pure Multani Mitti (Fullers Earth) clay.', 'Mix with rose water (for oily skin) or milk (for dry skin). Apply evenly, allow to dry completely (about 15 minutes), and wash off.', '/images/multani_mitti.png'),

('Rice Powder', 'SOOTHING', 'Skin Care', 'Finely milled rice flour that gently exfoliates while soothing sensitive skin. Improves elasticity, brightens overall skin tone, and leaves a silky-smooth finish.', 229.00, 'Finely ground premium organic rice.', 'Mix with honey or curd. Gently massage in circular motions on face/neck, leave as a pack for 10 minutes, and rinse with cold water.', '/images/rice_powder.png'),

('Ubtan Powder', 'RADIANCE', 'Skin Care', 'A traditional, premium blend of herbs, turmeric, and sandalwood. Radiates skin naturally, removes tan, and offers a timeless glowing complexion.', 349.00, 'Turmeric, Sandalwood, Chickpea flour, Rose petals, Neem, Orange peel.', 'Mix with milk or rose water. Apply on face/body, massage gently in circular motions, leave for 15-20 minutes, and rinse off.', '/images/ubtan_powder.png'),
('Chocolate Wax Powder', 'HAIR REMOVAL', 'Body Care', 'A luxurious, painless wax powder infused with rich cocoa. Offers easy hair removal while brightening and smoothing skin in the comfort of your home.', 399.00, 'Cocoa powder, natural clay, soothing botanicals.', 'Mix powder with water to make a semi-thick paste. Apply on body parts, let it dry for 10-15 minutes, then wipe off in the opposite direction of hair growth with a wet cloth.', '/images/chocolate_wax_powder.png')
ON CONFLICT DO NOTHING;
