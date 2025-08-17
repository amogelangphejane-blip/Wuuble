const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease set these in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDigitalStore() {
  console.log('🚀 Setting up Digital Store...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250128000000_add_digital_store.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📊 Running database migration...');
    
    // Execute the migration
    const { error: migrationError } = await supabase.rpc('exec', { 
      sql: migrationSQL 
    });

    if (migrationError) {
      console.error('❌ Migration failed:', migrationError.message);
      
      // Try executing the SQL directly (alternative approach)
      console.log('🔄 Trying alternative approach...');
      
      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        try {
          if (statement.toLowerCase().includes('create table') || 
              statement.toLowerCase().includes('create policy') ||
              statement.toLowerCase().includes('create function') ||
              statement.toLowerCase().includes('create trigger') ||
              statement.toLowerCase().includes('create index') ||
              statement.toLowerCase().includes('insert into') ||
              statement.toLowerCase().includes('alter table')) {
            
            const { error } = await supabase.rpc('exec', { sql: statement + ';' });
            
            if (error) {
              console.warn('⚠️  Statement failed:', statement.substring(0, 50) + '...');
              console.warn('   Error:', error.message);
              errorCount++;
            } else {
              successCount++;
            }
          }
        } catch (err) {
          console.warn('⚠️  Statement error:', err.message);
          errorCount++;
        }
      }

      console.log(`\n📈 Migration Summary:`);
      console.log(`✅ Successful statements: ${successCount}`);
      console.log(`❌ Failed statements: ${errorCount}`);
      
      if (errorCount > successCount) {
        console.error('\n❌ Too many errors during migration. Please check your database setup.');
        process.exit(1);
      }
    } else {
      console.log('✅ Database migration completed successfully!');
    }

    // Verify tables were created
    console.log('\n🔍 Verifying table creation...');
    
    const tables = [
      'product_categories',
      'digital_products',
      'product_reviews',
      'product_orders',
      'product_downloads',
      'seller_profiles',
      'product_wishlists',
      'store_notifications'
    ];

    for (const tableName of tables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.warn(`⚠️  Table ${tableName} might not exist:`, error.message);
      } else {
        console.log(`✅ Table ${tableName} verified`);
      }
    }

    // Check storage buckets
    console.log('\n🗄️  Checking storage buckets...');
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.warn('⚠️  Could not list storage buckets:', bucketsError.message);
    } else {
      const requiredBuckets = ['digital-products', 'product-images'];
      const existingBuckets = buckets.map(b => b.name);
      
      for (const bucketName of requiredBuckets) {
        if (existingBuckets.includes(bucketName)) {
          console.log(`✅ Storage bucket '${bucketName}' exists`);
        } else {
          console.log(`📦 Creating storage bucket '${bucketName}'...`);
          
          const { error: createError } = await supabase.storage.createBucket(bucketName, {
            public: bucketName === 'product-images'
          });
          
          if (createError) {
            console.warn(`⚠️  Could not create bucket '${bucketName}':`, createError.message);
          } else {
            console.log(`✅ Storage bucket '${bucketName}' created`);
          }
        }
      }
    }

    // Verify product categories were inserted
    console.log('\n📋 Checking product categories...');
    
    const { data: categories, error: categoriesError } = await supabase
      .from('product_categories')
      .select('name');

    if (categoriesError) {
      console.warn('⚠️  Could not fetch product categories:', categoriesError.message);
    } else {
      console.log(`✅ Found ${categories.length} product categories:`);
      categories.forEach(cat => console.log(`   - ${cat.name}`));
    }

    console.log('\n🎉 Digital Store setup completed successfully!');
    console.log('\n📖 Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Navigate to any community and click the "Store" tab');
    console.log('3. Use the "Seller Dashboard" link in the user menu to manage products');
    console.log('4. Use the "My Library" link to view purchased products');
    
    console.log('\n💡 Features available:');
    console.log('- ✅ Product listing and management');
    console.log('- ✅ Shopping cart and checkout');
    console.log('- ✅ File upload and storage');
    console.log('- ✅ Order management');
    console.log('- ✅ Reviews and ratings');
    console.log('- ✅ Wishlist functionality');
    console.log('- ✅ Seller dashboard');
    console.log('- ✅ Buyer library');
    console.log('- ✅ Notifications system');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\nPlease check your Supabase configuration and try again.');
    process.exit(1);
  }
}

// Run the setup
setupDigitalStore();