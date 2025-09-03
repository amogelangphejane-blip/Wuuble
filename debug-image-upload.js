import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugImageUpload() {
  try {
    console.log('🔍 Debugging image upload issues...\n');
    
    // Check if any streams exist
    console.log('📋 Checking live_streams...');
    const { data: streams, error: streamsError } = await supabase
      .from('live_streams')
      .select('id, title, display_image_url, thumbnail_url, creator_id')
      .limit(5);
    
    if (streamsError) {
      console.log('❌ Error fetching streams:', streamsError.message);
    } else if (!streams || streams.length === 0) {
      console.log('⚠️  No streams found in database');
      console.log('💡 Create a stream first, then try uploading an image');
    } else {
      console.log(`✅ Found ${streams.length} streams:`);
      streams.forEach((stream, index) => {
        console.log(`   ${index + 1}. ${stream.title}`);
        console.log(`      ID: ${stream.id}`);
        console.log(`      Display Image: ${stream.display_image_url || 'None'}`);
        console.log(`      Thumbnail: ${stream.thumbnail_url || 'None'}`);
        console.log(`      Creator: ${stream.creator_id}`);
        console.log('');
      });
    }
    
    // Check stream_images table
    console.log('📋 Checking stream_images table...');
    const { data: images, error: imagesError } = await supabase
      .from('stream_images')
      .select('*')
      .limit(5);
    
    if (imagesError) {
      console.log('❌ Error fetching stream images:', imagesError.message);
    } else if (!images || images.length === 0) {
      console.log('⚠️  No images found in stream_images table');
      console.log('💡 This means images are not being saved to the database');
    } else {
      console.log(`✅ Found ${images.length} images in stream_images table:`);
      images.forEach((image, index) => {
        console.log(`   ${index + 1}. Stream: ${image.stream_id}`);
        console.log(`      Image URL: ${image.image_url}`);
        console.log(`      Type: ${image.image_type}`);
        console.log(`      Active: ${image.is_active}`);
        console.log(`      Creator: ${image.creator_id}`);
        console.log('');
      });
    }
    
    // Check storage buckets
    console.log('📋 Checking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Error listing buckets:', bucketsError.message);
    } else {
      const relevantBuckets = buckets.filter(b => 
        ['stream-images', 'stream-thumbnails', 'profile-pictures'].includes(b.id)
      );
      
      if (relevantBuckets.length === 0) {
        console.log('❌ No relevant storage buckets found');
      } else {
        console.log(`✅ Found ${relevantBuckets.length} relevant buckets:`);
        relevantBuckets.forEach(bucket => {
          console.log(`   - ${bucket.id} (${bucket.public ? 'Public' : 'Private'})`);
        });
      }
    }
    
    // Check if any files exist in stream-images bucket
    console.log('📋 Checking files in stream-images bucket...');
    const { data: files, error: filesError } = await supabase.storage
      .from('stream-images')
      .list('', { limit: 10 });
    
    if (filesError) {
      console.log('❌ Error listing files:', filesError.message);
    } else if (!files || files.length === 0) {
      console.log('⚠️  No files found in stream-images bucket');
      console.log('💡 This means uploads are not reaching storage');
    } else {
      console.log(`✅ Found ${files.length} files in stream-images bucket:`);
      files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${file.metadata?.size || 'unknown size'})`);
      });
    }
    
    console.log('\n🎯 Diagnosis:');
    
    if (!streams || streams.length === 0) {
      console.log('❌ ISSUE: No streams exist');
      console.log('   → Create a stream first');
    } else if (!images || images.length === 0) {
      console.log('❌ ISSUE: Images not being saved to database');
      console.log('   → Check streamImageService.uploadDisplayImage() function');
      console.log('   → Check if user is authenticated when uploading');
    } else if (!files || files.length === 0) {
      console.log('❌ ISSUE: Images not being uploaded to storage');
      console.log('   → Check storage permissions');
      console.log('   → Check if buckets exist');
    } else {
      console.log('✅ Everything looks good in the database');
      console.log('   → The issue might be in the frontend display logic');
      console.log('   → Check browser console for errors');
    }
    
    console.log('\n📝 Next Steps:');
    console.log('1. Enable debug mode: localStorage.setItem("stream_debug", "true")');
    console.log('2. Open browser console when uploading images');
    console.log('3. Check for JavaScript errors during upload');
    console.log('4. Verify user is logged in when uploading');
    
  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
}

debugImageUpload();