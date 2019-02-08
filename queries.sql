-------------------------
-- 112 F18 question count
-------------------------
SELECT count(id) 
  FROM questions 
 WHERE course_id = 1 AND on_time > '2018-08-25'::timestamp;


-------------------------
-- Average time spent on questions without outliers
-------------------------
SELECT (sum(b.timespent)/(count(a.id)))
  FROM questions as a
  JOIN (SELECT id, (extract(epoch FROM off_time) - extract(epoch FROM on_time)) as timespent
  		FROM questions) as b
    ON a.id = b.id
 WHERE b.timespent < 9000;


-------------------------
-- Highest question count by single student
-------------------------
SELECT u.andrew_id, s.student_user_id, count
  FROM (SELECT distinct student_user_id, count(student_user_id) 
	      FROM questions group by student_user_id) as s
  JOIN users as u
    ON u.id = s.student_user_id
ORDER BY count DESC;


-------------------------
-- Download 112 F18 data as CSV
-------------------------
\copy (SELECT * FROM questions WHERE course_id=1 AND on_time >= '2018-08-27'::timestamp) To '~/Desktop/112.csv' With CSV


-------------------------
-- Download 112 current tas as CSV
-------------------------
\copy (SELECT user FROM roles WHERE course = 1 AND role = ‘ca’) To '~/Desktop/112tas.csv' With CSV


-------------------------
-- Download 213 F18 queue info (student, ta, on, help, off) as CSV
-------------------------
SELECT u.andrew_id as student, uu.andrew_id as ta, q.on_time, q.help_time, q.off_time 
  FROM questions as q 
  JOIN users as u 
	ON q.student_user_id = u.id 
  JOIN users as uu 
	ON q.ca_user_id = uu.id 
 WHERE course_id=2 AND on_time >= '2018-08-27'::timestamp
\copy (SELECT u.andrew_id as student, uu.andrew_id as ta, q.on_time, q.help_time, q.off_time FROM questions as q join users as u on q.student_user_id = u.id join users as uu on q.ca_user_id = uu.id WHERE course_id=2 AND on_time >= '2018-08-27'::timestamp) To '~/Desktop/213.csv' With CSV


-------------------------
-- Get all active courses
-------------------------
SELECT q.course_id, c.number, c.name FROM (SELECT DISTINCT course_id FROM questions WHERE on_time > '2018-08-25'::timestamp ORDER BY course_id ASC) as q JOIN courses as c ON q.course_id = c.id;


-------------------------
-- Get core courses staff
-------------------------
SELECT r.course, u.andrew_id
  FROM roles as r 
  JOIN users as u 
    ON r.user = u.id 
 WHERE (r.course = 1 or r.course = 2 or r.course = 6 or r.course = 8) and r.role like 'ca' 
 ORDER BY r.course ASC;


-------------------------
-- Get question count for all courses
-------------------------

SELECT DISTINCT c.number, count(q.id)
FROM questions as q
  JOIN courses as c
  ON q.course_id = c.id
WHERE q.on_time > '2018-08-27'::timestamp
GROUP BY c.number;

SELECT c.number, count(DISTINCT q.id)
  FROM questions as q
  JOIN courses as c
  ON q.course_id = c.id
WHERE q.on_time > '2018-08-27'::timestamp
GROUP BY c.number;


---------------------------
-- Get user count from last week by course
---------------------------
select c.number, count(distinct q.student_user_id) 
from questions as q 
join courses as c
  on c.id = q.course_id
where q.on_time > now() - interval '7 days' 
group by c.number;
