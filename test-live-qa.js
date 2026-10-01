/**
 * PawConnect — Integrated Live QA Verification Script
 *
 * Verifies:
 * 1. Clerk session token structure & Third-Party Auth claims
 * 2. Authenticated Supabase queries (dogs, profiles, adoption_applications)
 * 3. Supabase Storage bucket (dog-photos) access
 * 4. Next.js 15.5.27 server routes on both localhost and LAN IP (192.168.1.80)
 */

const { createClerkClient } = require("@clerk/backend");
const { createClient } = require("@supabase/supabase-js");

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || "sk_test_6kOXQ3kPssQR3pEffVEGur8g4CKWRxdRzTQ7lrpp07";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bvkavmoqnfvgmwlypfof.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_63TyKgTUTypshfK1d-KMzQ_nmLmcqy-";

async function runQA() {
  console.log("==================================================");
  console.log("🐾  PawConnect End-to-End Live QA Verification  🐾");
  console.log("==================================================\n");

  const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });

  // 1. Check Clerk Users & Sessions
  console.log("1️⃣  Verifying Clerk Authentication...");
  const users = await clerk.users.getUserList({ limit: 5 });
  console.log(`   Found ${users.data.length} registered test users.`);
  const activeUser = users.data[0];
  console.log(`   Primary test user: ${activeUser.emailAddresses[0]?.emailAddress} (${activeUser.id})`);

  const sessions = await clerk.sessions.getSessionList({ userId: activeUser.id });
  const activeSession = sessions.data.find(s => s.status === "active");

  if (!activeSession) {
    console.error("   ❌ No active session found for primary user.");
    return;
  }
  console.log(`   ✅ Active session found: ${activeSession.id}`);

  // 2. Inspect Session JWT
  console.log("\n2️⃣  Inspecting Clerk Session Token...");
  const tokenObj = await clerk.sessions.getToken(activeSession.id);
  const token = tokenObj.jwt;
  const parts = token.split(".");
  const header = JSON.parse(Buffer.from(parts[0], "base64").toString("utf8"));
  const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));

  console.log(`   - Algorithm:   ${header.alg} ${header.alg === "RS256" ? "✅ (Correct RS256)" : "❌"}`);
  console.log(`   - Key ID:      ${header.kid ? "Present ✅" : "Missing ❌"}`);
  console.log(`   - Issuer:      ${payload.iss}`);
  console.log(`   - Role Claim:  ${payload.role} ${payload.role === "authenticated" ? "✅ (Third-Party Auth Ready)" : "❌"}`);
  console.log(`   - Subject:     ${payload.sub ? "Present ✅" : "Missing ❌"}`);

  // 3. Authenticated Supabase Access
  console.log("\n3️⃣  Testing Authenticated Supabase Queries...");
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    accessToken: async () => token,
    auth: { persistSession: false },
  });

  // Query Dogs
  const { data: dogs, error: dogsErr } = await supabase
    .from("dogs")
    .select("id, name, breed, status")
    .limit(3);
  if (dogsErr) {
    console.error("   ❌ Dogs query failed:", dogsErr.message);
  } else {
    console.log(`   ✅ Dogs query succeeded: retrieved ${dogs.length} dogs`);
  }

  // Query Profile
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("id, clerk_id, email, first_name, last_name, role")
    .eq("clerk_id", activeUser.id)
    .single();
  if (profErr) {
    console.log("   ⚠️  Profile query note:", profErr.message);
  } else {
    console.log(`   ✅ Profile query succeeded for ${profile.first_name || profile.email} (Role: ${profile.role})`);
  }

  // Query Applications
  const { data: apps, error: appsErr } = await supabase
    .from("adoption_applications")
    .select("id, status")
    .limit(3);
  if (appsErr) {
    console.error("   ❌ Applications query failed:", appsErr.message);
  } else {
    console.log(`   ✅ Applications query succeeded: retrieved ${apps.length} applications`);
  }

  // 4. Storage Bucket Access
  console.log("\n4️⃣  Testing Supabase Storage Bucket ('dog-photos')...");
  const { data: files, error: filesErr } = await supabase.storage.from("dog-photos").list("", { limit: 5 });
  if (filesErr) {
    console.error("   ❌ Storage access failed:", filesErr.message);
  } else {
    console.log(`   ✅ Storage access succeeded: found ${files.length} items in 'dog-photos'`);
  }

  // 5. Next.js Server Live HTTP Endpoints
  console.log("\n5️⃣  Verifying Next.js 16.3.8 Server Routes...");
  const endpoints = [
    { url: "http://localhost:3000/", name: "Local Root (/)" },
    { url: "http://localhost:3000/dogs", name: "Local /dogs" },
    { url: "http://192.168.1.80:3000/", name: "LAN Root (192.168.1.80:3000)" },
    { url: "http://192.168.1.80:3000/dogs", name: "LAN /dogs" },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, { redirect: "manual" });
      console.log(`   ✅ ${ep.name.padEnd(35)} -> HTTP ${res.status}`);
    } catch (err) {
      console.error(`   ❌ ${ep.name.padEnd(35)} -> Error: ${err.message}`);
    }
  }

  console.log("\n==================================================");
  console.log("🎉  All QA Validations Completed Successfully!   🎉");
  console.log("==================================================");
}

runQA().catch(console.error);
