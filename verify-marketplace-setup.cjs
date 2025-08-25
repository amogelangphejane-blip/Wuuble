const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMarketplaceSetup() {
  console.log('🔍 Verifying marketplace storage setup...\n');
  
  let allGood = true;
  
  try {
    // Check buckets exist
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log('❌ Cannot access storage:', error.message);
      return false;
    }
    
    const requiredBuckets = [
      { name: 'product-images', shouldBePublic: true },
      { name: 'digital-products', shouldBePublic: false }
    ];
    
    console.log('📦 Checking required buckets:');
    
    for (const required of requiredBuckets) {
      const bucket = buckets.find(b => b.id === required.name);
      
      if (!bucket) {
        console.log(`   ❌ Missing: ${required.name}`);
        allGood = false;
      } else {
        const publicStatus = bucket.public === required.shouldBePublic ? '✅' : '⚠️';
        console.log(`   ${publicStatus} ${required.name} (${bucket.public ? 'public' : 'private'})`);
        
        if (bucket.public !== required.shouldBePublic) {
          console.log(`      Expected: ${required.shouldBePublic ? 'public' : 'private'}`);
          allGood = false;
        }
      }
    }
    
    // Check database tables
    console.log('\n📊 Checking database tables:');
    
    const tables = [
      'digital_products',
      'product_categories',
      'seller_profiles'
    ];
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (tableError) {
          console.log(`   ❌ ${table}: ${tableError.message}`);
          allGood = false;
        } else {
          console.log(`   ✅ ${table}`);
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`);
        allGood = false;
      }
    }
    
    // Overall status
    console.log('\n' + '='.repeat(50));
    
    if (allGood) {
      console.log('🎉 Marketplace setup is COMPLETE!');
      console.log('✅ All storage buckets exist with correct settings');
      console.log('✅ All database tables are accessible');
      console.log('\n🚀 Your marketplace file uploads should work perfectly!');
    } else {
      console.log('⚠️  Marketplace setup is INCOMPLETE');
      console.log('\n📝 Next steps:');
      console.log('1. Create missing buckets in Supabase Dashboard');
      console.log('2. Run database setup: node setup-digital-store.cjs');
      console.log('3. Run this verification again');
    }
    
  } catch (error) {
    console.log('💥 Verification failed:', error.message);
  }
}

verifyMarketplaceSetup();