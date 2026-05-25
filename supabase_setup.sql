-- noirkart Database Schema Setup
-- Copy and paste this script into your Supabase SQL Editor (https://supabase.com) to create the 'products' table in 2 seconds!

-- 1. Create the 'products' table
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    discount TEXT,
    rating NUMERIC DEFAULT 4.8,
    category TEXT NOT NULL,
    unit TEXT DEFAULT '1 piece',
    image TEXT NOT NULL,
    buy_link TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. Create public read policy (Allow anyone to view product catalog)
CREATE POLICY "Allow public read access" ON public.products
    FOR SELECT USING (true);

-- 4. Create public write policy (Allow catalog additions/deletions)
-- For this demo directory storefront, we permit all access. In enterprise setups, restrict to admin accounts.
CREATE POLICY "Allow all write access" ON public.products
    FOR ALL USING (true) WITH CHECK (true);

-- 5. Seed default premium products (Optional but helpful)
INSERT INTO public.products (name, price, original_price, discount, rating, category, unit, image, buy_link)
VALUES 
('Premium Wireless Headphones', 2999, 4999, '40% OFF', 4.8, 'Electronics', '1 piece', 'https://images.unsplash.com/photo-1567928513899-997d98489fbd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'https://www.amazon.in/s?k=premium+wireless+headphones'),
('Luxury Chronograph Watch', 8999, 12999, '30% OFF', 4.9, 'Fashion', '1 piece', 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'https://www.amazon.in/s?k=luxury+chronograph+watch'),
('Mechanical Keyboard Pro', 1899, 2999, '35% OFF', 4.7, 'Electronics', '1 piece', 'https://images.unsplash.com/photo-1563253746-350a0a877afa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'https://www.amazon.in/s?k=mechanical+keyboard+pro'),
('Designer Aviator Sunglasses', 2499, 3999, '38% OFF', 4.6, 'Fashion', '1 piece', 'https://images.unsplash.com/photo-1589642380614-4a8c2147b857?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'https://www.amazon.in/s?k=designer+aviator+sunglasses'),
('Pro Studio Headphones', 3499, 5999, '42% OFF', 4.9, 'Electronics', '1 piece', 'https://images.unsplash.com/photo-1599669454699-248893623440?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'https://www.amazon.in/s?k=pro+studio+headphones'),
('Smart Luxury Watch', 7999, 11999, '33% OFF', 4.8, 'Electronics', '1 piece', 'https://images.unsplash.com/photo-1670404160620-a3a86428560e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'https://www.amazon.in/s?k=smart+luxury+watch');
