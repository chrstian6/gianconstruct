// scripts/final-upload.ts
require("./load-env.js");

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadAvatars() {
  try {
    console.log("🚀 Starting avatar upload...");

    // Check if avatars bucket exists and is accessible
    const { data: files, error: listError } = await supabase.storage
      .from("avatars")
      .list("predefined");

    if (listError) {
      console.error("❌ Cannot access avatars bucket:", listError.message);
      return;
    }

    console.log("✅ Avatars bucket is accessible");

    // Upload all 13 avatars
    const avatarFiles = Array.from(
      { length: 13 },
      (_, i) => `avatar${i + 1}.png`
    );
    let successCount = 0;

    for (const avatarFile of avatarFiles) {
      const filePath = path.join(
        process.cwd(),
        "public",
        "images",
        "avatar",
        avatarFile
      );

      if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${avatarFile}`);
        continue;
      }

      try {
        const fileBuffer = fs.readFileSync(filePath);

        const { data, error } = await supabase.storage
          .from("avatars")
          .upload(`predefined/${avatarFile}`, fileBuffer, {
            contentType: "image/png",
            upsert: true,
          });

        if (error) {
          console.error(`❌ Failed to upload ${avatarFile}:`, error.message);
        } else {
          console.log(`✅ Uploaded ${avatarFile}`);
          successCount++;
        }
      } catch (fileError) {
        console.error(`❌ Error reading ${avatarFile}:`, fileError);
      }
    }

    console.log(`\n🎉 Upload completed: ${successCount}/13 avatars uploaded`);

    // Verify upload by listing files
    const { data: uploadedFiles } = await supabase.storage
      .from("avatars")
      .list("predefined");

    console.log("📁 Uploaded files:");
    uploadedFiles?.forEach((file) => {
      console.log(`   ✅ ${file.name}`);
    });
  } catch (error) {
    console.error("💥 Upload failed:", error);
  }
}

uploadAvatars();
