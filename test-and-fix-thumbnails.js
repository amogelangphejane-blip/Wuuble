#!/usr/bin/env node

/**
 * Thumbnail System Diagnostic and Fix Tool
 * This script tests and fixes common thumbnail issues
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration - Update these with your actual values
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class ThumbnailDiagnostic {
  constructor() {
    this.issues = [];
    this.fixes = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '💡',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'fix': '🔧'
    }[type] || '📝';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runDiagnostic() {
    this.log('Starting thumbnail system diagnostic...', 'info');
    
    try {
      await this.checkSupabaseConnection();
      await this.checkStorageBuckets();
      await this.checkStoragePolicies();
      await this.checkLiveStreams();
      await this.testThumbnailUrls();
      await this.generateReport();
    } catch (error) {
      this.log(`Diagnostic failed: ${error.message}`, 'error');
    }
  }

  async checkSupabaseConnection() {
    this.log('Checking Supabase connection...', 'info');
    
    try {
      const { data, error } = await supabase.from('live_streams').select('count').limit(1);
      if (error) throw error;
      this.log('Supabase connection successful', 'success');
    } catch (error) {
      this.issues.push('Supabase connection failed');
      this.log(`Connection failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async checkStorageBuckets() {
    this.log('Checking storage buckets...', 'info');
    
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      
      const expectedBuckets = ['stream-thumbnails', 'stream-images'];
      const existingBuckets = buckets.map(b => b.name);
      
      expectedBuckets.forEach(bucketName => {
        if (existingBuckets.includes(bucketName)) {
          this.log(`✓ ${bucketName} bucket exists`, 'success');
        } else {
          this.issues.push(`Missing ${bucketName} bucket`);
          this.fixes.push(`Create ${bucketName} bucket`);
          this.log(`✗ ${bucketName} bucket missing`, 'error');
        }
      });
      
      // Check bucket configuration
      const thumbnailBucket = buckets.find(b => b.name === 'stream-thumbnails');
      if (thumbnailBucket) {
        if (!thumbnailBucket.public) {
          this.issues.push('stream-thumbnails bucket is not public');
          this.fixes.push('Make stream-thumbnails bucket public');
          this.log('stream-thumbnails bucket should be public for thumbnail display', 'warning');
        }
      }
      
    } catch (error) {
      this.issues.push('Failed to check storage buckets');
      this.log(`Failed to check buckets: ${error.message}`, 'error');
    }
  }

  async checkStoragePolicies() {
    this.log('Testing storage policies...', 'info');
    
    try {
      // Test read access to stream-thumbnails
      const { data, error } = await supabase.storage
        .from('stream-thumbnails')
        .list('', { limit: 1 });
      
      if (error) {
        if (error.message.includes('not found')) {
          this.issues.push('stream-thumbnails bucket does not exist');
          this.fixes.push('Create stream-thumbnails bucket');
        } else if (error.message.includes('permission')) {
          this.issues.push('Storage policies prevent access to stream-thumbnails');
          this.fixes.push('Fix storage policies for stream-thumbnails bucket');
        }
        this.log(`Storage policy test failed: ${error.message}`, 'error');
      } else {
        this.log('Storage policies allow access', 'success');
      }
    } catch (error) {
      this.issues.push('Storage policy test failed');
      this.log(`Policy test error: ${error.message}`, 'error');
    }
  }

  async checkLiveStreams() {
    this.log('Analyzing live streams...', 'info');
    
    try {
      const { data: streams, error } = await supabase
        .from('live_streams')
        .select('id, title, thumbnail_url, display_image_url, status')
        .limit(10);
      
      if (error) throw error;
      
      this.log(`Found ${streams.length} streams`, 'info');
      
      let streamsWithThumbnails = 0;
      let streamsWithDisplayImages = 0;
      let streamsWithoutImages = 0;
      
      streams.forEach(stream => {
        if (stream.thumbnail_url) {
          streamsWithThumbnails++;
        } else if (stream.display_image_url) {
          streamsWithDisplayImages++;
        } else {
          streamsWithoutImages++;
        }
      });
      
      this.log(`Streams with thumbnails: ${streamsWithThumbnails}`, 'info');
      this.log(`Streams with display images: ${streamsWithDisplayImages}`, 'info');
      this.log(`Streams without images: ${streamsWithoutImages}`, 'info');
      
      if (streamsWithThumbnails === 0 && streams.length > 0) {
        this.issues.push('No streams have thumbnails set');
        this.fixes.push('Upload thumbnails for streams or check upload functionality');
      }
      
    } catch (error) {
      this.issues.push('Failed to analyze live streams');
      this.log(`Stream analysis failed: ${error.message}`, 'error');
    }
  }

  async testThumbnailUrls() {
    this.log('Testing thumbnail URL accessibility...', 'info');
    
    try {
      const { data: streams, error } = await supabase
        .from('live_streams')
        .select('id, title, thumbnail_url, display_image_url')
        .not('thumbnail_url', 'is', null)
        .limit(5);
      
      if (error) throw error;
      
      if (streams.length === 0) {
        this.log('No streams with thumbnails to test', 'warning');
        return;
      }
      
      for (const stream of streams) {
        const url = stream.thumbnail_url;
        try {
          const response = await fetch(url, { method: 'HEAD' });
          if (response.ok) {
            this.log(`✓ Thumbnail accessible: ${stream.title}`, 'success');
          } else {
            this.issues.push(`Thumbnail not accessible: ${stream.title} (HTTP ${response.status})`);
            this.log(`✗ Thumbnail not accessible: ${stream.title} (HTTP ${response.status})`, 'error');
          }
        } catch (fetchError) {
          this.issues.push(`Thumbnail URL error: ${stream.title}`);
          this.log(`✗ Thumbnail URL error: ${stream.title} - ${fetchError.message}`, 'error');
        }
      }
      
    } catch (error) {
      this.log(`URL test failed: ${error.message}`, 'error');
    }
  }

  async generateReport() {
    this.log('\n' + '='.repeat(60), 'info');
    this.log('THUMBNAIL SYSTEM DIAGNOSTIC REPORT', 'info');
    this.log('='.repeat(60), 'info');
    
    if (this.issues.length === 0) {
      this.log('🎉 No issues found! Thumbnail system appears to be working correctly.', 'success');
    } else {
      this.log(`Found ${this.issues.length} issue(s):`, 'warning');
      this.issues.forEach((issue, index) => {
        this.log(`${index + 1}. ${issue}`, 'error');
      });
      
      this.log('\nRecommended fixes:', 'fix');
      this.fixes.forEach((fix, index) => {
        this.log(`${index + 1}. ${fix}`, 'fix');
      });
      
      this.log('\nTo fix these issues:', 'info');
      this.log('1. Run the SQL fix script: fix-thumbnail-system.sql', 'info');
      this.log('2. Check your Supabase storage settings', 'info');
      this.log('3. Test thumbnail upload in your application', 'info');
      this.log('4. Use the web diagnostic tool: diagnose-thumbnail-issue.html', 'info');
    }
  }

  async autoFix() {
    this.log('Attempting automatic fixes...', 'fix');
    
    // Try to create missing buckets
    if (this.issues.some(issue => issue.includes('Missing') && issue.includes('bucket'))) {
      await this.createMissingBuckets();
    }
    
    // Try to fix broken URLs
    await this.fixBrokenUrls();
    
    this.log('Automatic fixes completed. Re-run diagnostic to verify.', 'success');
  }

  async createMissingBuckets() {
    this.log('Creating missing storage buckets...', 'fix');
    
    const bucketsToCreate = [
      {
        id: 'stream-thumbnails',
        name: 'stream-thumbnails',
        public: true,
        fileSizeLimit: 2 * 1024 * 1024, // 2MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      }
    ];
    
    for (const bucketConfig of bucketsToCreate) {
      try {
        const { data, error } = await supabase.storage.createBucket(bucketConfig.id, {
          public: bucketConfig.public,
          fileSizeLimit: bucketConfig.fileSizeLimit,
          allowedMimeTypes: bucketConfig.allowedMimeTypes
        });
        
        if (error && !error.message.includes('already exists')) {
          this.log(`Failed to create bucket ${bucketConfig.id}: ${error.message}`, 'error');
        } else {
          this.log(`Created bucket: ${bucketConfig.id}`, 'success');
        }
      } catch (error) {
        this.log(`Error creating bucket ${bucketConfig.id}: ${error.message}`, 'error');
      }
    }
  }

  async fixBrokenUrls() {
    this.log('Checking for broken thumbnail URLs...', 'fix');
    
    try {
      const { data: streams, error } = await supabase
        .from('live_streams')
        .select('id, thumbnail_url')
        .not('thumbnail_url', 'is', null);
      
      if (error) throw error;
      
      for (const stream of streams) {
        if (stream.thumbnail_url && !stream.thumbnail_url.includes('/storage/v1/object/public/')) {
          // Try to fix the URL format
          const fixedUrl = stream.thumbnail_url.replace(
            /.*stream-thumbnails\/(.*)/,
            `${SUPABASE_URL}/storage/v1/object/public/stream-thumbnails/$1`
          );
          
          if (fixedUrl !== stream.thumbnail_url) {
            const { error: updateError } = await supabase
              .from('live_streams')
              .update({ thumbnail_url: fixedUrl })
              .eq('id', stream.id);
            
            if (!updateError) {
              this.log(`Fixed URL for stream ${stream.id}`, 'success');
            }
          }
        }
      }
    } catch (error) {
      this.log(`URL fix failed: ${error.message}`, 'error');
    }
  }
}

// Main execution
async function main() {
  const diagnostic = new ThumbnailDiagnostic();
  
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  
  await diagnostic.runDiagnostic();
  
  if (shouldFix) {
    await diagnostic.autoFix();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default ThumbnailDiagnostic;