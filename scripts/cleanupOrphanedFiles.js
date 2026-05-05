import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Must use service role key for deletion

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function cleanupSupabase() {
  console.log("=== Cleaning up Supabase Storage ===");
  try {
    // 1. Get all contents, courses, and quiz_questions URLs from DB
    const { data: contents, error: err1 } = await supabase.from('contents').select('file_url');
    const { data: courses, error: err2 } = await supabase.from('courses').select('thumbnail_url');
    const { data: questions, error: err3 } = await supabase.from('quiz_questions').select('image_url');
    
    if (err1 || err2 || err3) throw err1 || err2 || err3;

    const activeUrls = new Set([
      ...contents.map(c => c.file_url).filter(Boolean),
      ...courses.map(c => c.thumbnail_url).filter(Boolean),
      ...(questions || []).map(q => q.image_url).filter(Boolean)
    ]);

    // 2. List all files in course-assets bucket
    const { data: files, error: listError } = await supabase.storage.from('course-assets').list();
    if (listError) throw listError;

    if (!files || files.length === 0) {
      console.log("No files found in Supabase storage.");
      return;
    }

    const bucketUrlPrefix = `${supabaseUrl}/storage/v1/object/public/course-assets/`;
    const filesToDelete = [];

    for (const file of files) {
      if (file.name === '.emptyFolderPlaceholder' || !file.id) continue;

      const fileUrl = `${bucketUrlPrefix}${file.name}`;
      
      // If this fileUrl is not in activeUrls, it's an orphan
      if (!activeUrls.has(fileUrl)) {
        filesToDelete.push(file.name);
      }
    }

    if (filesToDelete.length === 0) {
      console.log("No orphaned files found in Supabase.");
    } else {
      console.log(`Found ${filesToDelete.length} orphaned files in Supabase. Deleting...`);
      const { data: deleteData, error: deleteError } = await supabase.storage.from('course-assets').remove(filesToDelete);
      if (deleteError) throw deleteError;
      console.log(`Successfully deleted ${deleteData.length} files from Supabase.`);
    }

  } catch (err) {
    console.error("Error in Supabase cleanup:", err.message);
  }
}

async function cleanupCloudinary() {
  console.log("\n=== Cleaning up Cloudinary Storage ===");
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.log("CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET missing in .env.local. Skipping Cloudinary cleanup.");
    return;
  }

  try {
    const { data: contents, error } = await supabase.from('contents').select('file_url');
    if (error) throw error;

    const activeUrls = new Set(contents.map(c => c.file_url).filter(Boolean));

    let nextCursor = null;
    let allAssets = [];

    do {
      const response = await cloudinary.api.resources({
        resource_type: 'video',
        max_results: 500,
        next_cursor: nextCursor
      });
      allAssets = allAssets.concat(response.resources);
      nextCursor = response.next_cursor;
    } while (nextCursor);

    const publicIdsToDelete = [];

    for (const asset of allAssets) {
      const assetUrl = asset.secure_url;
      if (!activeUrls.has(assetUrl)) {
        publicIdsToDelete.push(asset.public_id);
      }
    }

    if (publicIdsToDelete.length === 0) {
      console.log("No orphaned files found in Cloudinary.");
    } else {
      console.log(`Found ${publicIdsToDelete.length} orphaned files in Cloudinary. Deleting...`);
      for (let i = 0; i < publicIdsToDelete.length; i += 100) {
        const chunk = publicIdsToDelete.slice(i, i + 100);
        await cloudinary.api.delete_resources(chunk, { resource_type: 'video' });
      }
      console.log("Successfully deleted orphaned files from Cloudinary.");
    }
  } catch (err) {
    console.error("Error in Cloudinary cleanup:", err.message);
  }
}

async function runCleanup() {
  console.log("Starting Orphaned Files Cleanup...\n");
  await cleanupSupabase();
  await cleanupCloudinary();
  console.log("\nCleanup Finished.");
}

runCleanup();
