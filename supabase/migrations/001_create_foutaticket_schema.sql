-- ==============================================================================
-- FOUTATICKET - PostgreSQL & Supabase Database Migration
-- Architecture Anti-Fraude & Transactions Atomiques pour Billetterie & Contrôle
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enumerations
CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',
    'ORGANIZER',
    'EVENT_MANAGER',
    'SELLER',
    'CONTROLLER',
    'FINANCE'
);

CREATE TYPE event_status AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');
CREATE TYPE ticket_status AS ENUM ('VALID', 'USED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE payment_method AS ENUM ('WAVE', 'ORANGE_MONEY', 'FREE_MONEY', 'CASH');
CREATE TYPE scan_result AS ENUM ('VALID', 'ALREADY_SCANNED', 'INVALID');
CREATE TYPE sales_channel AS ENUM ('ONLINE', 'POS_GUICHET');

-- 3. Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role user_role NOT NULL DEFAULT 'ORGANIZER',
    avatar_url TEXT,
    organization VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Events Table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    location_details VARCHAR(255),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    banner_image TEXT,
    description TEXT,
    status event_status NOT NULL DEFAULT 'DRAFT',
    total_capacity INTEGER NOT NULL DEFAULT 0,
    sold_capacity INTEGER NOT NULL DEFAULT 0,
    organizer_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Ticket Types Table (Categories & Pricing)
CREATE TABLE ticket_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    badge VARCHAR(50),
    description TEXT,
    total_quantity INTEGER NOT NULL CHECK (total_quantity >= 0),
    sold_quantity INTEGER NOT NULL DEFAULT 0 CHECK (sold_quantity <= total_quantity),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
    payment_method payment_method NOT NULL,
    payment_status payment_status NOT NULL DEFAULT 'PENDING',
    seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    channel sales_channel NOT NULL DEFAULT 'ONLINE',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tickets Table (With strict anti-fraud constraints)
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_code VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE RESTRICT,
    gate_recommendation VARCHAR(100),
    seat_number VARCHAR(50),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    price_paid INTEGER NOT NULL,
    status ticket_status NOT NULL DEFAULT 'VALID',
    qr_data TEXT NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    used_gate VARCHAR(100),
    used_by_controller UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Scans Table (Audit trail of every gate scan attempt)
CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    ticket_code VARCHAR(50) NOT NULL,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    gate VARCHAR(100) NOT NULL,
    controller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    result scan_result NOT NULL,
    error_message TEXT,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Withdrawals Table (Organizer Payouts)
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    amount INTEGER NOT NULL CHECK (amount > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    payout_method payment_method NOT NULL,
    payout_destination VARCHAR(255) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- ATOMIC STORED PROCEDURES (Anti-Double-Scan & Anti-Overbooking)
-- ==============================================================================

-- Atomic Function: Validate Ticket at Gate (Prevents Race Conditions)
CREATE OR REPLACE FUNCTION validate_ticket_atomic(
    p_ticket_code VARCHAR(50),
    p_gate VARCHAR(100),
    p_controller_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_ticket RECORD;
    v_result scan_result;
    v_error_msg TEXT := NULL;
    v_response JSONB;
BEGIN
    -- 1. Find ticket with row lock
    SELECT * INTO v_ticket 
    FROM tickets 
    WHERE ticket_code = p_ticket_code 
    FOR UPDATE;

    -- Case A: Ticket not found
    IF NOT FOUND THEN
        v_result := 'INVALID';
        v_error_msg := 'Billet introuvable ou faux code';
        
        INSERT INTO scans (ticket_code, event_id, gate, controller_id, result, error_message)
        VALUES (p_ticket_code, NULL, p_gate, p_controller_id, v_result, v_error_msg);

        RETURN jsonb_build_object(
            'success', FALSE,
            'result', v_result,
            'message', v_error_msg
        );
    END IF;

    -- Case B: Ticket already used (Fraud / Double Validation)
    IF v_ticket.status = 'USED' THEN
        v_result := 'ALREADY_SCANNED';
        v_error_msg := format('Billet déjà validé le %s à %s', v_ticket.used_at, v_ticket.used_gate);
        
        INSERT INTO scans (ticket_id, ticket_code, event_id, gate, controller_id, result, error_message)
        VALUES (v_ticket.id, v_ticket.ticket_code, v_ticket.event_id, p_gate, p_controller_id, v_result, v_error_msg);

        RETURN jsonb_build_object(
            'success', FALSE,
            'result', v_result,
            'message', v_error_msg,
            'ticket', jsonb_build_object(
                'ticketCode', v_ticket.ticket_code,
                'customerName', v_ticket.customer_name,
                'usedAt', v_ticket.used_at,
                'usedGate', v_ticket.used_gate
            )
        );
    END IF;

    -- Case C: Ticket is valid -> Update atomically
    UPDATE tickets 
    SET 
        status = 'USED',
        used_at = NOW(),
        used_gate = p_gate,
        used_by_controller = p_controller_id
    WHERE id = v_ticket.id;

    v_result := 'VALID';
    INSERT INTO scans (ticket_id, ticket_code, event_id, gate, controller_id, result)
    VALUES (v_ticket.id, v_ticket.ticket_code, v_ticket.event_id, p_gate, p_controller_id, v_result);

    RETURN jsonb_build_object(
        'success', TRUE,
        'result', v_result,
        'message', 'Billet validé avec succès',
        'ticket', jsonb_build_object(
            'ticketCode', v_ticket.ticket_code,
            'customerName', v_ticket.customer_name,
            'gateRecommendation', v_ticket.gate_recommendation,
            'seatNumber', v_ticket.seat_number
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
