-- Check actual credits in database for your user
SELECT user_id, email, credits, updated_at 
FROM profiles 
WHERE email = 'altcoinsocial@gmail.com';
