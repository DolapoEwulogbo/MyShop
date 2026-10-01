-- seed.sql — run ONCE after 001 and 002. Placeholder images from picsum.photos.
-- Includes one low-stock (3) and one out-of-stock (0) product to test those UI states.

insert into public.products (name, description, price, image_url, stock) values
('Canvas Tote Bag',      'Sturdy everyday tote in natural cotton canvas with an inner zip pocket.',            8500,  'https://picsum.photos/seed/tote/600/600',      40),
('Ceramic Coffee Mug',   'Hand-glazed 350ml mug. Dishwasher and microwave safe.',                              4500,  'https://picsum.photos/seed/mug/600/600',       60),
('Linen Throw Pillow',   'Soft 45x45cm linen cover with a removable insert.',                                  12000, 'https://picsum.photos/seed/pillow/600/600',    25),
('Scented Soy Candle',   'Slow-burning soy wax candle, about 40 hours. Lemongrass and ginger.',                7000,  'https://picsum.photos/seed/candle/600/600',    30),
('Leather Notebook',     'A5 notebook with 160 cream pages and a genuine leather cover.',                      15000, 'https://picsum.photos/seed/notebook/600/600',  18),
('Wireless Earbuds',     'Bluetooth 5.3 earbuds with a charging case and up to 20 hours total playback.',      32000, 'https://picsum.photos/seed/earbuds/600/600',   12),
('Insulated Water Bottle','750ml stainless steel bottle. Keeps drinks cold 24 hours, hot 12 hours.',           11000, 'https://picsum.photos/seed/bottle/600/600',    3),
('Desk Lamp',            'Adjustable LED desk lamp with three brightness levels and a USB port.',              19500, 'https://picsum.photos/seed/lamp/600/600',      0);
