#!/usr/bin/env node

/**
 * SootheAI Environment Variables Verification Script
 * Checks all required environment variables for Vercel + Supabase + Kie deployment
 */

console.log('🔍 SootheAI Environment Variables Verification\n');

// Required environment variables
const requiredVars = {
  // Supabase Configuration
  'SUPABASE_URL': 'Supabase project URL',
  'SUPABASE_KEY': 'Supabase anon key',
  'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key',
  'NEXT_PUBLIC_SUPABASE_URL': 'Public Supabase URL (client-side)',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Public Supabase anon key (client-side)',
  
  // Kie.ai Configuration (Music Generation)
  'VIBEFORGE_API_KEY': 'VibeForge API key for music generation (Kie.ai)',
  
  // Image Generation (Runware/DeepInfra - at least one required)
  'RUNWARE_API_KEY': 'Runware API key for image generation',
  'DEEPINFRA_API_KEY': 'DeepInfra API key for image generation',
  
  // Callback Configuration
  'KIE_CALLBACK_URL': 'Kie.ai callback URL',
  'NEXT_PUBLIC_BASE_URL': 'Base URL for API calls',
  
  // Environment
  'NODE_ENV': 'Node environment'
};

// Critical variables that must match
const matchingPairs = [
  ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'],
  ['SUPABASE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
];

let allPresent = true;
let allMatching = true;

console.log('📋 Checking Required Environment Variables:\n');

// Check each required variable
Object.entries(requiredVars).forEach(([varName, description]) => {
  const value = process.env[varName];
  const isPresent = value && value.trim() !== '';
  
  if (isPresent) {
    console.log(`✅ ${varName}: ${description}`);
    // Sanitize and show first/last few characters for verification
    const sanitized = value.length > 8 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : '***';
    console.log(`   Value: ${sanitized}`);
  } else {
    console.log(`❌ ${varName}: ${description} - MISSING OR EMPTY`);
    allPresent = false;
  }
  console.log('');
});

// Check matching pairs
console.log('🔗 Checking Matching Variable Pairs:\n');
matchingPairs.forEach(([var1, var2]) => {
  const val1 = process.env[var1];
  const val2 = process.env[var2];
  
  if (val1 && val2) {
    if (val1 === val2) {
      console.log(`✅ ${var1} matches ${var2}`);
    } else {
      console.log(`❌ ${var1} does NOT match ${var2}`);
      allMatching = false;
    }
  } else {
    console.log(`⚠️  Cannot compare ${var1} and ${var2} - one or both missing`);
    allMatching = false;
  }
});

console.log('\n📊 Summary:');
console.log(`Environment Variables Present: ${allPresent ? '✅' : '❌'}`);
console.log(`Matching Pairs Correct: ${allMatching ? '✅' : '❌'}`);

if (!allPresent || !allMatching) {
  console.log('\n⚠️  ISSUES DETECTED:');
  
  if (!allPresent) {
    console.log('Missing or empty environment variables detected.');
    console.log('Please add the missing variables to your Vercel dashboard:');
    console.log('1. Go to Vercel Dashboard → Project Settings → Environment Variables');
    console.log('2. Add any missing variables listed above');
    console.log('3. Set for: All Environments (Development, Preview, Production)');
  }
  
  if (!allMatching) {
    console.log('Variable pairs do not match.');
    console.log('Ensure NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL');
    console.log('Ensure NEXT_PUBLIC_SUPABASE_ANON_KEY = SUPABASE_KEY');
  }
  
  console.log('\n🚫 Build should not proceed until all issues are resolved.');
  process.exit(1);
} else {
  console.log('\n🎉 All environment variables verified successfully!');
  console.log('✅ Ready for deployment.');
  process.exit(0);
}

