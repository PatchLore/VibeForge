-- Check generation_tasks for the task
SELECT * FROM generation_tasks WHERE task_id = '7b687ab0631ad60fc4e260938288bc14';

-- Check tracks table
SELECT task_id, user_id, title, created_at FROM tracks WHERE task_id = '7b687ab0631ad60fc4e260938288bc14';
