-- Lehman Brothers V2 - Sample Data
-- Insert test data for development

-- Insert test users
INSERT INTO users (id, first_name, last_name, email, password, role, active) VALUES
    (uuid_generate_v4(), 'Jean', 'Dupont', 'jean.dupont@email.com', '$2b$10$hashedpassword1', 'CLIENT', true),
    (uuid_generate_v4(), 'Marie', 'Martin', 'marie.martin@email.com', '$2b$10$hashedpassword2', 'CLIENT', true),
    (uuid_generate_v4(), 'Pierre', 'Durand', 'pierre.durand@email.com', '$2b$10$hashedpassword3', 'CLIENT', true),
    (uuid_generate_v4(), 'Sophie', 'Bernard', 'sophie.bernard@email.com', '$2b$10$hashedpassword4', 'ADVISOR', true),
    (uuid_generate_v4(), 'Michel', 'Leroy', 'michel.leroy@email.com', '$2b$10$hashedpassword5', 'ADVISOR', true),
    (uuid_generate_v4(), 'Catherine', 'Moreau', 'catherine.moreau@email.com', '$2b$10$hashedpassword6', 'DIRECTOR', true);

-- Retrieve IDs for references
DO $$
DECLARE
    client1_id UUID;
    client2_id UUID;
    client3_id UUID;
    advisor1_id UUID;
    advisor2_id UUID;
    director_id UUID;
BEGIN
    -- Retrieve IDs
    SELECT id INTO client1_id FROM users WHERE email = 'jean.dupont@email.com';
    SELECT id INTO client2_id FROM users WHERE email = 'marie.martin@email.com';
    SELECT id INTO client3_id FROM users WHERE email = 'pierre.durand@email.com';
    SELECT id INTO advisor1_id FROM users WHERE email = 'sophie.bernard@email.com';
    SELECT id INTO advisor2_id FROM users WHERE email = 'michel.leroy@email.com';
    SELECT id INTO director_id FROM users WHERE email = 'catherine.moreau@email.com';

    -- Insert accounts
    INSERT INTO accounts (user_id, iban, name, balance, is_savings) VALUES
        (client1_id, 'FR1420041010050500013M02606', 'Main Current Account', 1500.00, false),
        (client1_id, 'FR1420041010050500013M02607', 'Savings Account', 5000.00, true),
        (client2_id, 'FR1420041010050500013M02608', 'Personal Account', 2300.50, false),
        (client2_id, 'FR1420041010050500013M02609', 'Retirement Savings', 12000.00, true),
        (client3_id, 'FR1420041010050500013M02610', 'Business Account', 850.75, false);

    -- Insert initial savings rate
    INSERT INTO savings_rates (rate, effective_date, updated_by) VALUES
        (0.0250, CURRENT_DATE, director_id);

    -- Insert stocks
    INSERT INTO stocks (name, symbol, available) VALUES
        ('Apple Inc.', 'AAPL', true),
        ('Microsoft Corporation', 'MSFT', true),
        ('Amazon.com Inc.', 'AMZN', true),
        ('Alphabet Inc.', 'GOOGL', true),
        ('Tesla Inc.', 'TSLA', true),
        ('Meta Platforms Inc.', 'META', true),
        ('Netflix Inc.', 'NFLX', true),
        ('NVIDIA Corporation', 'NVDA', true);

    -- Insert sample transactions
    INSERT INTO transactions (source_account_id, target_account_id, amount, type) 
    SELECT 
        a1.id, a2.id, 200.00, 'DEBIT'
    FROM accounts a1, accounts a2 
    WHERE a1.iban = 'FR1420041010050500013M02606' 
    AND a2.iban = 'FR1420041010050500013M02608';

    -- Insert sample orders
    INSERT INTO orders (user_id, stock_id, type, unit_price, quantity, status)
    SELECT 
        client1_id, s.id, 'BUY', 150.00, 10, 'EXECUTED'
    FROM stocks s WHERE s.symbol = 'AAPL';

    -- Insert sample loan
    INSERT INTO loans (user_id, amount, annual_rate, insurance_rate, months) VALUES
        (client2_id, 25000.00, 0.0350, 0.0050, 60);

    -- Insert installments for the loan
    INSERT INTO installments (loan_id, principal, interest, insurance, total, due_date)
    SELECT 
        l.id, 416.67, 72.92, 10.42, 500.01, 
        CURRENT_DATE + INTERVAL '1 month' * generate_series(1, 60)
    FROM loans l 
    WHERE l.amount = 25000.00;

    -- Insert sample chats
    INSERT INTO chats (client_id, advisor_id, open) VALUES
        (client1_id, advisor1_id, true),
        (client2_id, advisor2_id, false);

    -- Insert sample messages
    INSERT INTO messages (chat_id, author_id, content, from_client)
    SELECT 
        c.id, client1_id, 'Hello, I would like information about savings accounts.', true
    FROM chats c 
    WHERE c.client_id = client1_id;

    INSERT INTO messages (chat_id, author_id, content, from_client)
    SELECT 
        c.id, advisor1_id, 'Hello! I would be happy to provide you with information about our savings products.', false
    FROM chats c 
    WHERE c.client_id = client1_id;

END $$;
