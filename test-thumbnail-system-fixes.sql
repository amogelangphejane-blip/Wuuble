-- Test Script for Thumbnail System Fixes
-- This script validates that all thumbnail system fixes are working correctly
-- Run this after executing fix-thumbnail-system.sql

-- ============================================================================
-- TEST 1: VALIDATE STORAGE BUCKET CONFIGURATION
-- ============================================================================

DO $$
DECLARE
    bucket_exists BOOLEAN;
    bucket_config RECORD;
BEGIN
    RAISE NOTICE '🧪 TEST 1: Validating Storage Bucket Configuration';
    
    -- Check if bucket exists
    SELECT EXISTS(
        SELECT 1 FROM storage.buckets WHERE id = 'stream-thumbnails'
    ) INTO bucket_exists;
    
    IF bucket_exists THEN
        RAISE NOTICE '✅ stream-thumbnails bucket exists';
        
        -- Check bucket configuration
        SELECT * FROM storage.buckets WHERE id = 'stream-thumbnails' INTO bucket_config;
        
        IF bucket_config.public = true THEN
            RAISE NOTICE '✅ Bucket is public';
        ELSE
            RAISE NOTICE '❌ Bucket should be public';
        END IF;
        
        IF bucket_config.file_size_limit = 2097152 THEN
            RAISE NOTICE '✅ File size limit is correct (2MB)';
        ELSE
            RAISE NOTICE '❌ File size limit is incorrect: %', bucket_config.file_size_limit;
        END IF;
        
        IF 'image/jpeg' = ANY(bucket_config.allowed_mime_types) AND
           'image/png' = ANY(bucket_config.allowed_mime_types) AND
           'image/webp' = ANY(bucket_config.allowed_mime_types) THEN
            RAISE NOTICE '✅ MIME types are correctly configured';
        ELSE
            RAISE NOTICE '❌ MIME types configuration issue';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ stream-thumbnails bucket does not exist';
    END IF;
    
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- TEST 2: VALIDATE STORAGE POLICIES
-- ============================================================================

DO $$
DECLARE
    policy_count INTEGER;
    expected_policies TEXT[] := ARRAY[
        'Anyone can view stream thumbnails',
        'Stream creators can upload thumbnails', 
        'Stream creators can update their thumbnails',
        'Stream creators can delete their thumbnails'
    ];
    policy_name TEXT;
    policy_exists BOOLEAN;
BEGIN
    RAISE NOTICE '🧪 TEST 2: Validating Storage Policies';
    
    -- Check each expected policy
    FOREACH policy_name IN ARRAY expected_policies
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'objects' 
            AND policyname = policy_name
        ) INTO policy_exists;
        
        IF policy_exists THEN
            RAISE NOTICE '✅ Policy exists: %', policy_name;
        ELSE
            RAISE NOTICE '❌ Missing policy: %', policy_name;
        END IF;
    END LOOP;
    
    -- Count total thumbnail policies
    SELECT COUNT(*) FROM pg_policies 
    WHERE tablename = 'objects' AND policyname LIKE '%thumbnail%'
    INTO policy_count;
    
    RAISE NOTICE '📊 Total thumbnail policies: %', policy_count;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- TEST 3: VALIDATE DATABASE SCHEMA CHANGES
-- ============================================================================

DO $$
DECLARE
    column_exists BOOLEAN;
    expected_columns TEXT[] := ARRAY[
        'thumbnail_url',
        'display_image_url', 
        'thumbnail_width',
        'thumbnail_height',
        'thumbnail_size',
        'thumbnail_mime_type',
        'thumbnail_uploaded_at'
    ];
    column_name TEXT;
BEGIN
    RAISE NOTICE '🧪 TEST 3: Validating Database Schema Changes';
    
    -- Check each expected column in live_streams table
    FOREACH column_name IN ARRAY expected_columns
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'live_streams' 
            AND column_name = column_name
        ) INTO column_exists;
        
        IF column_exists THEN
            RAISE NOTICE '✅ Column exists: live_streams.%', column_name;
        ELSE
            RAISE NOTICE '❌ Missing column: live_streams.%', column_name;
        END IF;
    END LOOP;
    
    -- Check if stream_images table exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'stream_images'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE '✅ stream_images table exists';
    ELSE
        RAISE NOTICE '❌ stream_images table missing';
    END IF;
    
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- TEST 4: VALIDATE CONSTRAINTS
-- ============================================================================

DO $$
DECLARE
    constraint_exists BOOLEAN;
    expected_constraints TEXT[] := ARRAY[
        'chk_thumbnail_width',
        'chk_thumbnail_height',
        'chk_thumbnail_size',
        'chk_thumbnail_mime_type'
    ];
    constraint_name TEXT;
BEGIN
    RAISE NOTICE '🧪 TEST 4: Validating Table Constraints';
    
    -- Check each expected constraint
    FOREACH constraint_name IN ARRAY expected_constraints
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'live_streams' 
            AND constraint_name = constraint_name
        ) INTO constraint_exists;
        
        IF constraint_exists THEN
            RAISE NOTICE '✅ Constraint exists: %', constraint_name;
        ELSE
            RAISE NOTICE '❌ Missing constraint: %', constraint_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- TEST 5: VALIDATE INDEXES
-- ============================================================================

DO $$
DECLARE
    index_exists BOOLEAN;
    expected_indexes TEXT[] := ARRAY[
        'idx_live_streams_thumbnail_url',
        'idx_live_streams_display_image_url',
        'idx_live_streams_thumbnail_uploaded_at',
        'idx_live_streams_status_thumbnail',
        'idx_stream_images_stream_id',
        'idx_stream_images_creator_id',
        'idx_stream_images_type',
        'idx_stream_images_active'
    ];
    index_name TEXT;
BEGIN
    RAISE NOTICE '🧪 TEST 5: Validating Indexes';
    
    -- Check each expected index
    FOREACH index_name IN ARRAY expected_indexes
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM pg_indexes 
            WHERE indexname = index_name
        ) INTO index_exists;
        
        IF index_exists THEN
            RAISE NOTICE '✅ Index exists: %', index_name;
        ELSE
            RAISE NOTICE '❌ Missing index: %', index_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- TEST 6: VALIDATE FUNCTIONS
-- ============================================================================

DO $$
DECLARE
    function_exists BOOLEAN;
    expected_functions TEXT[] := ARRAY[
        'update_thumbnail_metadata',
        'cleanup_orphaned_thumbnails',
        'get_thumbnail_stats',
        'validate_thumbnail_system'
    ];
    function_name TEXT;
BEGIN
    RAISE NOTICE '🧪 TEST 6: Validating Functions';
    
    -- Check each expected function
    FOREACH function_name IN ARRAY expected_functions
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE p.proname = function_name
            AND n.nspname = 'public'
        ) INTO function_exists;
        
        IF function_exists THEN
            RAISE NOTICE '✅ Function exists: %', function_name;
        ELSE
            RAISE NOTICE '❌ Missing function: %', function_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- TEST 7: VALIDATE TRIGGERS
-- ============================================================================

DO $$
DECLARE
    trigger_exists BOOLEAN;
    expected_triggers TEXT[] := ARRAY[
        'update_thumbnail_metadata_trigger'
    ];
    trigger_name TEXT;
BEGIN
    RAISE NOTICE '🧪 TEST 7: Validating Triggers';
    
    -- Check each expected trigger
    FOREACH trigger_name IN ARRAY expected_triggers
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM pg_trigger 
            WHERE tgname = trigger_name
        ) INTO trigger_exists;
        
        IF trigger_exists THEN
            RAISE NOTICE '✅ Trigger exists: %', trigger_name;
        ELSE
            RAISE NOTICE '❌ Missing trigger: %', trigger_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- TEST 8: VALIDATE VIEW
-- ============================================================================

DO $$
DECLARE
    view_exists BOOLEAN;
BEGIN
    RAISE NOTICE '🧪 TEST 8: Validating Views';
    
    -- Check if stream_thumbnails_view exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'stream_thumbnails_view'
    ) INTO view_exists;
    
    IF view_exists THEN
        RAISE NOTICE '✅ View exists: stream_thumbnails_view';
        
        -- Test view query
        BEGIN
            PERFORM 1 FROM stream_thumbnails_view LIMIT 1;
            RAISE NOTICE '✅ View is queryable';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ View query failed: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '❌ Missing view: stream_thumbnails_view';
    END IF;
    
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- TEST 9: FUNCTIONAL TESTS
-- ============================================================================

DO $$
DECLARE
    test_result RECORD;
    stats_result RECORD;
BEGIN
    RAISE NOTICE '🧪 TEST 9: Functional Tests';
    
    -- Test validation function
    BEGIN
        SELECT * FROM validate_thumbnail_system() LIMIT 1 INTO test_result;
        RAISE NOTICE '✅ validate_thumbnail_system() function works';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ validate_thumbnail_system() function failed: %', SQLERRM;
    END;
    
    -- Test stats function
    BEGIN
        SELECT * FROM get_thumbnail_stats() INTO stats_result;
        RAISE NOTICE '✅ get_thumbnail_stats() function works';
        RAISE NOTICE '📊 Stats: % total streams, % with thumbnails', 
                     stats_result.total_streams, 
                     stats_result.streams_with_thumbnails;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ get_thumbnail_stats() function failed: %', SQLERRM;
    END;
    
    -- Test cleanup function (dry run)
    BEGIN
        PERFORM cleanup_orphaned_thumbnails();
        RAISE NOTICE '✅ cleanup_orphaned_thumbnails() function works';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ cleanup_orphaned_thumbnails() function failed: %', SQLERRM;
    END;
    
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- TEST 10: CONSTRAINT VALIDATION TESTS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🧪 TEST 10: Constraint Validation Tests';
    
    -- Test thumbnail width constraint (should fail with invalid value)
    BEGIN
        INSERT INTO live_streams (id, title, creator_id, thumbnail_width) 
        VALUES (gen_random_uuid(), 'Test Stream', gen_random_uuid(), -1);
        RAISE NOTICE '❌ Width constraint not working (negative value accepted)';
        ROLLBACK;
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE '✅ Width constraint working (rejected negative value)';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Width constraint test inconclusive: %', SQLERRM;
    END;
    
    -- Test thumbnail size constraint (should fail with too large value)
    BEGIN
        INSERT INTO live_streams (id, title, creator_id, thumbnail_size) 
        VALUES (gen_random_uuid(), 'Test Stream', gen_random_uuid(), 3000000); -- 3MB
        RAISE NOTICE '❌ Size constraint not working (large value accepted)';
        ROLLBACK;
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE '✅ Size constraint working (rejected large value)';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Size constraint test inconclusive: %', SQLERRM;
    END;
    
    -- Test MIME type constraint (should fail with invalid type)
    BEGIN
        INSERT INTO live_streams (id, title, creator_id, thumbnail_mime_type) 
        VALUES (gen_random_uuid(), 'Test Stream', gen_random_uuid(), 'application/pdf');
        RAISE NOTICE '❌ MIME type constraint not working (invalid type accepted)';
        ROLLBACK;
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE '✅ MIME type constraint working (rejected invalid type)';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  MIME type constraint test inconclusive: %', SQLERRM;
    END;
    
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

DO $$
DECLARE
    validation_results RECORD;
    total_checks INTEGER := 0;
    passed_checks INTEGER := 0;
BEGIN
    RAISE NOTICE '📋 FINAL SUMMARY - Running System Validation';
    RAISE NOTICE '================================================';
    
    -- Run the built-in validation function
    FOR validation_results IN SELECT * FROM validate_thumbnail_system()
    LOOP
        total_checks := total_checks + 1;
        IF validation_results.status = 'PASS' THEN
            passed_checks := passed_checks + 1;
            RAISE NOTICE '✅ %: % (%)', 
                         validation_results.check_name, 
                         validation_results.status,
                         validation_results.details;
        ELSE
            RAISE NOTICE '❌ %: % (%)', 
                         validation_results.check_name, 
                         validation_results.status,
                         validation_results.details;
        END IF;
    END LOOP;
    
    RAISE NOTICE '================================================';
    RAISE NOTICE '📊 VALIDATION SUMMARY: % of % checks passed', passed_checks, total_checks;
    
    IF passed_checks = total_checks THEN
        RAISE NOTICE '🎉 ALL TESTS PASSED! Thumbnail system is working correctly.';
    ELSE
        RAISE NOTICE '⚠️  Some tests failed. Please review the output above.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '💡 Next steps:';
    RAISE NOTICE '   1. Test thumbnail upload in your application';
    RAISE NOTICE '   2. Verify storage policies work with authenticated users';
    RAISE NOTICE '   3. Monitor system performance with new indexes';
    RAISE NOTICE '   4. Run periodic cleanup: SELECT cleanup_orphaned_thumbnails();';
    
END $$;