# 🔐 Supabase Auth System Setup

## ✅ What's Implemented

### **Core Components:**
- ✅ **AuthProvider** - Global auth state management
- ✅ **useAuth hook** - Easy auth state access
- ✅ **AuthButton** - Sign in/out button component
- ✅ **AuthModal** - Beautiful sign in/up modal
- ✅ **UserCredits** - Display user credits (placeholder)

### **Features:**
- ✅ **Email/Password Authentication**
- ✅ **User Registration**
- ✅ **Password Reset**
- ✅ **Session Management**
- ✅ **Auth State Persistence**
- ✅ **Error Handling**
- ✅ **Loading States**

## 🚀 How to Use

### **1. Environment Variables**
Make sure you have these in your Vercel environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **2. Supabase Setup**
1. Go to your Supabase project dashboard
2. Navigate to **Authentication > Settings**
3. Configure your **Site URL**: `https://your-domain.com`
4. Add **Redirect URLs**: 
   - `https://your-domain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

### **3. Database Setup**
Run the SQL script to create the `profiles` table:

```sql
-- Create profiles table for user subscription data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  plan TEXT DEFAULT 'free',
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL USING (auth.role() = 'service_role');
```

## 🎯 Usage Examples

### **In Components:**
```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, loading, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.email}!</p>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <p>Please sign in</p>
      )}
    </div>
  );
}
```

### **Protected Routes:**
```tsx
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function ProtectedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  if (loading) return <div>Loading...</div>;
  if (!user) return null;
  
  return <div>Protected content</div>;
}
```

## 🔧 Customization

### **Styling:**
All components use Tailwind CSS and can be customized by modifying the className props in:
- `AuthButton.tsx`
- `AuthModal.tsx`
- `UserCredits.tsx`

### **Auth Flow:**
The auth flow is handled automatically:
1. User clicks "Sign In" → Opens modal
2. User enters credentials → Calls Supabase auth
3. On success → Modal closes, user is signed in
4. On error → Error message displayed

### **Session Management:**
- Sessions are automatically persisted
- Auth state updates in real-time
- Automatic token refresh
- Secure cookie handling

## 🚨 Security Notes

- ✅ **Client-side auth** is safe for public data
- ✅ **Server-side operations** use service role key
- ✅ **RLS policies** protect user data
- ✅ **Environment variables** are properly secured

## 🧪 Testing

### **Development:**
1. Start your app: `npm run dev`
2. Click "Sign In" button
3. Create account or sign in
4. Check Supabase dashboard for new users

### **Production:**
1. Deploy to Vercel
2. Configure Supabase redirect URLs
3. Test auth flow in production

## 🔄 Next Steps

- [ ] Add social auth (Google, GitHub)
- [ ] Implement user profiles
- [ ] Add role-based permissions
- [ ] Create user dashboard
- [ ] Add email verification flow

---

**🎉 Your auth system is ready!** Users can now sign up, sign in, and access protected features.
