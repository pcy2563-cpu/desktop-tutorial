ALTER TABLE forum_likes
ADD UNIQUE KEY uniq_user_post_like (user_id, post_id);
