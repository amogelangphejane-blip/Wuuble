# Quick Setup Guide - Patreon-Style Subscription

## 🚀 Get It Working in 3 Steps

### Step 1: Apply Database Migration

Run this command to create all the necessary tables:

```bash
# Navigate to your project
cd /workspace

# Apply the migration
supabase db push
```

Or manually apply the migration file:
```bash
psql -d your_database < supabase/migrations/20250204000000_add_patreon_style_revenue_system.sql
```

### Step 2: Create Membership Tiers

**Option A: Use the UI (Recommended)**

1. Go to any community you own
2. Click **"About"** tab
3. Find the **"Subscription & Billing"** card (purple/pink with ❤️)
4. Click **"Manage Tiers"** button
5. Click **"Create Tier"**
6. Fill in the form:
   - Name: "Bronze Supporter"
   - Price: $5
   - Benefits: Add a few perks
   - Icon: Heart
   - Color: Purple
7. Click **"Create Tier"**
8. Repeat for Silver ($10) and Gold ($25) tiers

**Option B: Insert via SQL (Quick Test)**

```sql
-- Insert sample tiers for a community
-- Replace 'YOUR-COMMUNITY-ID' with actual community ID

INSERT INTO membership_tiers (
  community_id,
  name,
  description,
  price_monthly,
  benefits,
  color,
  icon,
  is_highlighted,
  position
) VALUES 
-- Bronze Tier
(
  'YOUR-COMMUNITY-ID',
  'Bronze Supporter',
  'Show your support and get basic perks',
  5.00,
  '["Access to supporter-only discussions", "Bronze supporter badge", "Monthly thank you message"]'::jsonb,
  '#CD7F32',
  'heart',
  false,
  1
),
-- Silver Tier (Most Popular)
(
  'YOUR-COMMUNITY-ID',
  'Silver Patron',
  'Enhanced support with exclusive benefits',
  10.00,
  '["All Bronze benefits", "Early access to content", "Vote on community decisions", "Priority support", "Silver patron badge"]'::jsonb,
  '#C0C0C0',
  'star',
  true,
  2
),
-- Gold Tier
(
  'YOUR-COMMUNITY-ID',
  'Gold Member',
  'Ultimate support with premium perks',
  25.00,
  '["All Silver benefits", "Exclusive video calls", "Custom role in community", "Personal mentorship session", "Gold member badge", "Name in credits"]'::jsonb,
  '#FFD700',
  'crown',
  false,
  3
);
```

### Step 3: Test It Out!

1. **As a Member:**
   - Navigate to the community
   - Click **"About"** tab
   - In the **"Subscription & Billing"** card, click **"Become a Patron"**
   - You should see your 3 tiers displayed beautifully!
   - Click any tier to test the payment flow

2. **As a Creator:**
   - Click **"View Earnings"** to see your dashboard
   - Click **"Manage Tiers"** to edit tiers

---

## 🧪 Testing with Stripe

Use these test cards:

```
✅ Success: 4242 4242 4242 4242
❌ Decline: 4000 0000 0000 0002
🔐 3D Secure: 4000 0025 0000 3155
```

**Expiry:** Any future date  
**CVC:** Any 3 digits  
**ZIP:** Any 5 digits

---

## 📍 Where Everything Is Located

### **Subscription & Billing Card** (About Section)

```
Community → About Tab
  ↓
[Subscription & Billing Card] 💜 (purple/pink gradient)
  ├─ Become a Patron (all users)
  ├─ Manage Tiers (creators only)
  └─ View Earnings (creators only)
```

### **What Happens When You Click Each Button:**

1. **"Become a Patron"** → Opens dialog with membership tiers
2. **"Manage Tiers"** → Opens tier management interface
3. **"View Earnings"** → Opens creator earnings dashboard

---

## ✅ Verify It's Working

After setup, you should see:

### For Members:
- ✅ Purple/pink "Subscription & Billing" card in About section
- ✅ "Become a Patron" button
- ✅ Clicking it shows membership tiers
- ✅ Can select a tier and see payment form
- ✅ Card payment form with Visa/Mastercard badges

### For Creators:
- ✅ All of the above, PLUS:
- ✅ "Manage Tiers" button
- ✅ "View Earnings" button
- ✅ Can create/edit/delete tiers
- ✅ Can see earnings dashboard
- ✅ Can request payouts

---

## 🔍 Troubleshooting

### "No membership tiers available"

**Problem:** No tiers created yet  
**Solution:** Use "Manage Tiers" button to create tiers (or use SQL above)

### Card in About section not showing

**Problem:** Component not updated  
**Solution:** 
1. Refresh the page
2. Make sure you're on the **About** tab
3. Look for the purple/pink gradient card

### Payment not working

**Problem:** Stripe not configured  
**Solution:** Add Stripe keys to `.env`:
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### Revenue split not calculating

**Problem:** Database function not applied  
**Solution:** Re-run the migration

---

## 💰 How Revenue Split Works

Every payment is automatically split:

```
Member pays $10
  ↓
Creator receives: $7.00 (70%)
Platform receives: $3.00 (30%)
  ↓
Creator's pending balance: +$7.00
  ↓ (after 7 days)
Creator's available balance: +$7.00
  ↓
Creator requests payout
```

---

## 📊 Check Database

Verify tables were created:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%tier%' OR table_name LIKE '%wallet%';

-- Should show:
-- membership_tiers
-- creator_wallets
-- revenue_transactions
-- payout_requests
-- saved_payment_methods
-- platform_revenue
```

---

## 🎨 Customize Colors

Edit tier colors in the UI:
- Click "Manage Tiers"
- Edit a tier
- Choose from 8 preset colors:
  - Purple, Pink, Blue, Green, Amber, Red, Indigo, Teal

Or add custom colors in the database:
```sql
UPDATE membership_tiers 
SET color = '#YOUR_HEX_COLOR' 
WHERE id = 'tier-id';
```

---

## 🎯 Quick Reference

| What | Where | Action |
|------|-------|--------|
| **Create Tiers** | About → Manage Tiers | Click "Create Tier" |
| **Edit Tiers** | About → Manage Tiers | Click tier to edit |
| **View Earnings** | About → View Earnings | See dashboard |
| **Request Payout** | Earnings Dashboard | Click "Withdraw Funds" |
| **Become Patron** | About → Become a Patron | Select tier |
| **View Revenue** | Earnings → Transactions | See all payments |

---

## 🎉 You're All Set!

The Patreon-style subscription system is now active in your About section!

**Test Flow:**
1. ✅ Go to About tab
2. ✅ See purple/pink billing card
3. ✅ Click "Manage Tiers" (creators)
4. ✅ Create a few tiers
5. ✅ Click "Become a Patron" (all users)
6. ✅ See beautiful tier cards
7. ✅ Test payment with 4242 4242 4242 4242
8. ✅ Check earnings in "View Earnings"

**Revenue automatically splits 70/30 on every payment!** 💰
