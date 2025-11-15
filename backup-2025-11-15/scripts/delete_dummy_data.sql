-- Delete dummy videos based on keywords across title and url fields
DELETE FROM videos
WHERE title LIKE '%dummy%' OR title LIKE '%test%' OR title LIKE '%demo%' OR title LIKE '%임시%' OR title LIKE '%더미%'
   OR url LIKE '%dummy%' OR url LIKE '%test%' OR url LIKE '%demo%' OR url LIKE '%임시%' OR url LIKE '%더미%';

-- Delete dummy notices based on keywords across title and content fields
DELETE FROM notices
WHERE title LIKE '%dummy%' OR content LIKE '%dummy%'
   OR title LIKE '%test%' OR content LIKE '%test%'
   OR title LIKE '%demo%' OR content LIKE '%demo%'
   OR title LIKE '%임시%' OR content LIKE '%임시%'
   OR title LIKE '%더미%' OR content LIKE '%더미%';

-- Delete dummy feedback entries based on keywords across user_name and comment fields
DELETE FROM feedback
WHERE user_name LIKE '%dummy%' OR comment LIKE '%dummy%'
   OR user_name LIKE '%test%' OR comment LIKE '%test%'
   OR user_name LIKE '%demo%' OR comment LIKE '%demo%'
   OR user_name LIKE '%임시%' OR comment LIKE '%임시%'
   OR user_name LIKE '%더미%' OR comment LIKE '%더미%';
