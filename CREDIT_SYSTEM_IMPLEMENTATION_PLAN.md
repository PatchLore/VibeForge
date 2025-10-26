# 💎 Credit System Implementation Plan

## 🎯 **Goal**
Implement a credit system for music generation without breaking the existing working functionality.

## ✅ **Current Working State**
- ✅ Navbar with proper authentication (Sign In/Sign Up buttons)
- ✅ Working authentication system
- ✅ Infinite Vibes Stream marked as "Coming Soon"
- ✅ Drum and Bass preset option
- ✅ All existing features functioning

## 🚨 **What Broke Previously**
The credit system implementation broke:
- Navbar authentication (stuck in loading state)
- Supabase client initialization (multiple instances)
- Existing working functionality

## 📋 **Credit System Requirements**

### **1. Database Schema**
```sql
-- Create profiles table for user credits
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  credits INTEGER DEFAULT 10 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, credits)
  VALUES (NEW.id, 10);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### **2. API Route Changes**

#### **Music Generation API (`/app/api/music/route.ts`)**
```typescript
// Requirements:
- Require ≥ 12 credits for music generation
- Check credits before generation
- Deduct credits only after successful generation
- Return remaining credits in response
- Use existing Supabase client pattern (don't create new ones)

// Implementation approach:
1. Use existing Supabase client from the working version
2. Add credit check before music generation
3. Deduct credits only after successful generation
4. Maintain existing error handling patterns
```

### **3. Frontend Changes**

#### **Navbar Component**
```typescript
// Requirements:
- Display credits for logged-in users
- Update credits in real-time after generation
- Don't break existing authentication flow

// Implementation approach:
1. Add credits display to existing navbar
2. Use existing Supabase client (don't create new ones)
3. Subscribe to real-time updates for credits
4. Maintain existing loading states and error handling
```

#### **Main Page (`/app/page.tsx`)**
```typescript
// Requirements:
- Pass user ID to music generation API
- Handle credit-related error messages
- Update UI based on credit status

// Implementation approach:
1. Modify existing handleGenerate function
2. Add userId to API call
3. Handle new error messages for insufficient credits
4. Don't break existing generation flow
```

### **4. New Components Needed**

#### **CreditsDisplay Component**
```typescript
// Requirements:
- Show current credits for logged-in users
- Real-time updates when credits change
- Styled badge format

// Implementation approach:
1. Create new component
2. Use existing Supabase client pattern
3. Subscribe to profiles table changes
4. Only show for authenticated users
```

#### **Dashboard Page (`/app/dashboard/page.tsx`)**
```typescript
// Requirements:
- Display user profile and credits
- Sign out functionality
- Styled with existing design patterns

// Implementation approach:
1. Create new dashboard page
2. Use existing authentication patterns
3. Fetch user profile and credits
4. Match existing UI styling
```

## 🛡️ **Implementation Strategy**

### **Phase 1: Database Setup**
1. ✅ Run SQL schema in Supabase
2. ✅ Verify RLS policies work
3. ✅ Test profile creation on signup

### **Phase 2: API Changes**
1. ✅ Modify `/app/api/music/route.ts` to check credits
2. ✅ Add credit deduction after successful generation
3. ✅ Test with existing frontend

### **Phase 3: Frontend Integration**
1. ✅ Add CreditsDisplay component to navbar
2. ✅ Modify main page to pass userId
3. ✅ Handle credit-related error messages

### **Phase 4: Dashboard**
1. ✅ Create dashboard page
2. ✅ Add navigation links
3. ✅ Test complete flow

## ⚠️ **Critical Implementation Rules**

### **DO NOT:**
- ❌ Create new Supabase client instances
- ❌ Modify existing authentication flow
- ❌ Change existing navbar structure
- ❌ Break existing music generation
- ❌ Use different Supabase patterns than existing code

### **DO:**
- ✅ Use existing Supabase client patterns
- ✅ Maintain existing error handling
- ✅ Follow existing code structure
- ✅ Test each change incrementally
- ✅ Keep existing functionality intact

## 🔧 **Technical Implementation Notes**

### **Supabase Client Pattern**
```typescript
// Use existing pattern from working version:
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### **Credit Check Pattern**
```typescript
// Check credits before generation:
const { data: profile } = await supabase
  .from('profiles')
  .select('credits')
  .eq('user_id', user.id)
  .single();

if (!profile || profile.credits < 12) {
  return NextResponse.json({ 
    success: false, 
    message: "💎 Not enough credits! You need 12 credits to generate music." 
  }, { status: 403 });
}
```

### **Credit Deduction Pattern**
```typescript
// Deduct credits only after success:
const { error: deductError } = await supabase
  .from('profiles')
  .update({
    credits: profile.credits - 12,
    updated_at: new Date().toISOString()
  })
  .eq('user_id', user.id);
```

## 🎯 **Success Criteria**
- ✅ Music generation requires 12 credits
- ✅ Credits are deducted only after successful generation
- ✅ Credits display in navbar for logged-in users
- ✅ Real-time credit updates
- ✅ Dashboard shows user profile and credits
- ✅ All existing functionality remains intact
- ✅ No authentication issues
- ✅ No Supabase client conflicts

## 📝 **Next Steps**
1. Implement database schema
2. Modify music API route incrementally
3. Add credits display to navbar
4. Create dashboard page
5. Test complete flow
6. Deploy and verify everything works
