// Script to create all storage policies via Supabase API
// This bypasses the SQL permission issues by using the API directly

const { createClient } = require('@supabase/supabase-js');

// Use your service role key for admin operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Storage buckets configuration
const buckets = [
  {
    id: 'stream-thumbnails',
    name: 'stream-thumbnails',
    public: true,
    file_size_limit: 2097152, // 2MB
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'stream-segments',
    name: 'stream-segments',
    public: true,
    file_size_limit: 52428800, // 50MB
    allowed_mime_types: ['video/mp4', 'application/vnd.apple.mpegurl', 'application/dash+xml', 'video/mp2t']
  },
  {
    id: 'stream-recordings',
    name: 'stream-recordings',
    public: false,
    file_size_limit: 1073741824, // 1GB
    allowed_mime_types: ['video/mp4', 'video/webm', 'video/quicktime']
  },
  {
    id: 'stream-chat-attachments',
    name: 'stream-chat-attachments',
    public: true,
    file_size_limit: 10485760, // 10MB
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
  }
];

// Storage policies configuration
const policies = {
  'stream-thumbnails': [
    {
      name: 'Anyone can view stream thumbnails',
      command: 'SELECT',
      definition: `bucket_id = 'stream-thumbnails'`
    },
    {
      name: 'Stream creators can upload thumbnails',
      command: 'INSERT',
      definition: `bucket_id = 'stream-thumbnails' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE creator_id = auth.uid())`
    },
    {
      name: 'Stream creators can update their thumbnails',
      command: 'UPDATE',
      definition: `bucket_id = 'stream-thumbnails' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE creator_id = auth.uid())`
    },
    {
      name: 'Stream creators can delete their thumbnails',
      command: 'DELETE',
      definition: `bucket_id = 'stream-thumbnails' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE creator_id = auth.uid())`
    }
  ],
  'stream-segments': [
    {
      name: 'Anyone can view active stream segments',
      command: 'SELECT',
      definition: `bucket_id = 'stream-segments' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE status = 'live')`
    },
    {
      name: 'Stream creators can upload segments',
      command: 'INSERT',
      definition: `bucket_id = 'stream-segments' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE creator_id = auth.uid())`
    },
    {
      name: 'Stream creators can delete their segments',
      command: 'DELETE',
      definition: `bucket_id = 'stream-segments' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE creator_id = auth.uid())`
    }
  ],
  'stream-recordings': [
    {
      name: 'Users can view recordings of accessible streams',
      command: 'SELECT',
      definition: `bucket_id = 'stream-recordings' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE community_id IS NULL OR community_id IN (SELECT id FROM communities WHERE is_private = false) OR community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid() AND status = 'approved') OR creator_id = auth.uid())`
    },
    {
      name: 'Stream creators can upload recordings',
      command: 'INSERT',
      definition: `bucket_id = 'stream-recordings' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE creator_id = auth.uid())`
    },
    {
      name: 'Stream creators can delete their recordings',
      command: 'DELETE',
      definition: `bucket_id = 'stream-recordings' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE creator_id = auth.uid())`
    }
  ],
  'stream-chat-attachments': [
    {
      name: 'Users can view chat attachments for accessible streams',
      command: 'SELECT',
      definition: `bucket_id = 'stream-chat-attachments' AND (storage.foldername(name))[1] IN (SELECT id::text FROM live_streams WHERE community_id IS NULL OR community_id IN (SELECT id FROM communities WHERE is_private = false) OR community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid() AND status = 'approved') OR creator_id = auth.uid())`
    },
    {
      name: 'Authenticated users can upload chat attachments',
      command: 'INSERT',
      definition: `bucket_id = 'stream-chat-attachments' AND auth.role() = 'authenticated' AND (storage.foldername(name))[2]::uuid = auth.uid()`
    },
    {
      name: 'Users can delete their own chat attachments',
      command: 'DELETE',
      definition: `bucket_id = 'stream-chat-attachments' AND auth.role() = 'authenticated' AND (storage.foldername(name))[2]::uuid = auth.uid()`
    }
  ]
};

async function createStorageBuckets() {
  console.log('🚀 Creating storage buckets...\n');
  
  for (const bucket of buckets) {
    try {
      console.log(`📦 Creating bucket: ${bucket.id}`);
      
      const { data, error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.file_size_limit,
        allowedMimeTypes: bucket.allowed_mime_types
      });
      
      if (error && !error.message.includes('already exists')) {
        console.error(`❌ Failed to create ${bucket.id}:`, error.message);
      } else if (error && error.message.includes('already exists')) {
        console.log(`✅ ${bucket.id} already exists`);
      } else {
        console.log(`✅ ${bucket.id} created successfully`);
      }
    } catch (err) {
      console.error(`💥 Error creating ${bucket.id}:`, err.message);
    }
  }
}

async function createStoragePolicies() {
  console.log('\n🔒 Creating storage policies...\n');
  
  for (const [bucketId, bucketPolicies] of Object.entries(policies)) {
    console.log(`📋 Creating policies for ${bucketId}:`);
    
    for (const policy of bucketPolicies) {
      try {
        // First, try to drop existing policy
        await supabase.rpc('exec_sql', {
          query: `DROP POLICY IF EXISTS "${policy.name}" ON storage.objects;`
        });
        
        // Create the policy
        const policySQL = `
          CREATE POLICY "${policy.name}" ON storage.objects
          FOR ${policy.command} USING (${policy.definition});
        `;
        
        const { data, error } = await supabase.rpc('exec_sql', {
          query: policySQL
        });
        
        if (error) {
          console.error(`❌ Failed to create policy "${policy.name}":`, error.message);
        } else {
          console.log(`  ✅ ${policy.name}`);
        }
      } catch (err) {
        console.error(`💥 Error creating policy "${policy.name}":`, err.message);
      }
    }
  }
}

async function createCleanupFunctions() {
  console.log('\n🧹 Creating cleanup functions...\n');
  
  const functions = [
    {
      name: 'cleanup_expired_stream_segments',
      sql: `
        CREATE OR REPLACE FUNCTION cleanup_expired_stream_segments()
        RETURNS void AS $$
        BEGIN
          DELETE FROM storage.objects 
          WHERE bucket_id = 'stream-segments' 
          AND created_at < NOW() - INTERVAL '24 hours';
          
          DELETE FROM storage.objects 
          WHERE bucket_id = 'stream-segments' 
          AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM live_streams 
            WHERE status = 'ended' 
            AND updated_at < NOW() - INTERVAL '1 hour'
          );
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    {
      name: 'cleanup_orphaned_chat_attachments',
      sql: `
        CREATE OR REPLACE FUNCTION cleanup_orphaned_chat_attachments()
        RETURNS void AS $$
        BEGIN
          DELETE FROM storage.objects 
          WHERE bucket_id = 'stream-chat-attachments' 
          AND (storage.foldername(name))[1] NOT IN (
            SELECT id::text FROM live_streams
          );
          
          DELETE FROM storage.objects 
          WHERE bucket_id = 'stream-chat-attachments' 
          AND created_at < NOW() - INTERVAL '30 days';
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    {
      name: 'cleanup_old_recordings',
      sql: `
        CREATE OR REPLACE FUNCTION cleanup_old_recordings()
        RETURNS void AS $$
        BEGIN
          DELETE FROM storage.objects 
          WHERE bucket_id = 'stream-recordings' 
          AND created_at < NOW() - INTERVAL '90 days'
          AND (storage.foldername(name))[1] IN (
            SELECT s.id::text FROM live_streams s
            JOIN profiles p ON s.creator_id = p.user_id
            WHERE p.subscription_tier IS NULL OR p.subscription_tier = 'free'
          );
          
          DELETE FROM storage.objects 
          WHERE bucket_id = 'stream-recordings' 
          AND created_at < NOW() - INTERVAL '1 year'
          AND (storage.foldername(name))[1] IN (
            SELECT s.id::text FROM live_streams s
            JOIN profiles p ON s.creator_id = p.user_id
            WHERE p.subscription_tier = 'premium'
          );
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    {
      name: 'log_storage_usage',
      sql: `
        CREATE OR REPLACE FUNCTION log_storage_usage()
        RETURNS void AS $$
        BEGIN
          INSERT INTO storage_usage_logs (
            bucket_id,
            total_objects,
            total_size_bytes,
            logged_at
          )
          SELECT 
            bucket_id,
            COUNT(*) as total_objects,
            SUM(metadata->>'size')::BIGINT as total_size_bytes,
            NOW()
          FROM storage.objects 
          GROUP BY bucket_id;
        END;
        $$ LANGUAGE plpgsql;
      `
    }
  ];
  
  // First create the storage_usage_logs table
  try {
    await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS storage_usage_logs (
          id SERIAL PRIMARY KEY,
          bucket_id TEXT NOT NULL,
          total_objects INTEGER NOT NULL,
          total_size_bytes BIGINT NOT NULL,
          logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    console.log('✅ storage_usage_logs table created');
  } catch (err) {
    console.error('❌ Failed to create storage_usage_logs table:', err.message);
  }
  
  // Create functions
  for (const func of functions) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: func.sql
      });
      
      if (error) {
        console.error(`❌ Failed to create function ${func.name}:`, error.message);
      } else {
        console.log(`✅ ${func.name} function created`);
      }
    } catch (err) {
      console.error(`💥 Error creating function ${func.name}:`, err.message);
    }
  }
}

async function testSetup() {
  console.log('\n🧪 Testing setup...\n');
  
  // Test bucket creation
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('❌ Failed to list buckets:', error.message);
    } else {
      console.log('📦 Available buckets:', buckets.map(b => b.name).join(', '));
    }
  } catch (err) {
    console.error('💥 Error listing buckets:', err.message);
  }
  
  // Test functions
  const testFunctions = [
    'cleanup_expired_stream_segments',
    'cleanup_orphaned_chat_attachments',
    'cleanup_old_recordings',
    'log_storage_usage'
  ];
  
  for (const funcName of testFunctions) {
    try {
      const { data, error } = await supabase.rpc(funcName);
      if (error) {
        console.error(`❌ Function ${funcName} test failed:`, error.message);
      } else {
        console.log(`✅ Function ${funcName} works`);
      }
    } catch (err) {
      console.error(`💥 Function ${funcName} test error:`, err.message);
    }
  }
}

async function main() {
  console.log('🎯 Setting up comprehensive livestream storage policies...\n');
  
  try {
    await createStorageBuckets();
    await createStoragePolicies();
    await createCleanupFunctions();
    await testSetup();
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Set up cleanup cron jobs in your application');
    console.log('2. Test upload functionality with authenticated users');
    console.log('3. Monitor storage usage and costs');
    
  } catch (error) {
    console.error('\n💥 Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  main();
}

module.exports = { main };