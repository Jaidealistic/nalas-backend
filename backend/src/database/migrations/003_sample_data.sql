-- Add demo user for UI flow
INSERT INTO users (id, email, phone, password_hash, role) VALUES 
('d8e4f1a2-3b4c-5d6e-7f8a-9b0c1d2e3f4a', 'demo@magilamfoods.com', '0000000000', 'hashed_pass', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Add sample data for UI demonstration
INSERT INTO menu_categories (id, name, display_order) VALUES 
('c1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', 'Premium Starters', 1),
('c2b3c4d5-e6f7-7a9b-9c1d-e2f3a4b5c6d7', 'Main Course', 2);

INSERT INTO menu_items (id, category_id, name, description, base_unit, min_quantity, unit_price, is_active) VALUES 
('7a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d', 'c1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', 'Mini Vegetable Samosa', 'Crispy spicy samosas', 'piece', 50, 15.00, true),
('8a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', 'c2b3c4d5-e6f7-7a9b-9c1d-e2f3a4b5c6d7', 'Paneer Tikka', 'Grilled cottage cheese', 'plate', 20, 180.00, true);
