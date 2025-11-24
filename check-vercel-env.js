#!/usr/bin/env node

/**
 * Vercel Environment Variables Checker
 * Verifies environment variables are properly set in Vercel
 */

const { execSync } = require('child_process');

console.log('🔍 Checking Vercel Environment Variables\n');

try {
  // Get Vercel environment variables
  const output = execSync('vercel env ls', { encoding: 'utf8' });
  
  console.log('📋 Current Vercel Environment Variables:\n');
  
  // Parse the output to extract variable names
  const lines = output.split('\n');
  const envVars = [];
  
  lines.forEach(line => {
    if (line.includes('Encrypted') && line.includes('Development, Preview, Production')) {
      const match = line.match(/^\s*(\w+)\s+Encrypted/);
      if (match) {
        envVars.push(match[1]);
      }
    }
  });
  
  // Required variables
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'VIBEFORGE_API_KEY', // Music generation (Kie.ai)
    'KIE_CALLBACK_URL',
    'RUNWARE_API_KEY', // Image generation (Runware)
    'DEEPINFRA_API_KEY', // Image generation (DeepInfra) - at least one of RUNWARE or DEEPINFRA required
    'NEXT_PUBLIC_BASE_URL',
    'NODE_ENV'
  ];
  
  let allPresent = true;
  
  console.log('✅ Present Variables:');
  requiredVars.forEach(varName => {
    if (envVars.includes(varName)) {
      console.log(`  ✅ ${varName}`);
    } else {
      console.log(`  ❌ ${varName} - MISSING`);
      allPresent = false;
    }
  });
  
  console.log('\n📊 Summary:');
  if (allPresent) {
    console.log('🎉 All required environment variables are present in Vercel!');
    console.log('✅ Ready for deployment.');
  } else {
    console.log('⚠️  Missing environment variables detected.');
    console.log('\n🔧 Action Required:');
    console.log('1. Go to Vercel Dashboard → Project Settings → Environment Variables');
    console.log('2. Add the missing variables listed above');
    console.log('3. Set for: All Environments (Development, Preview, Production)');
    console.log('\nMissing variables:');
    requiredVars.forEach(varName => {
      if (!envVars.includes(varName)) {
        console.log(`  - ${varName}`);
      }
    });
  }
  
} catch (error) {
  console.error('❌ Error checking Vercel environment variables:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Make sure you are logged into Vercel CLI: vercel login');
  console.log('2. Make sure you are in the correct project directory');
  console.log('3. Try running: vercel env ls');
}

