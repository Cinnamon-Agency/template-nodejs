export const AuthQueries = {
  storeUserSession: `
  SET @userId = ?;
  DELETE FROM user_session
  WHERE user_id = @userId;
  INSERT INTO user_session (user_id, refresh_token)
  VALUES(@userId, ?, ?);
  SELECT id, user_id as 'userId', refresh_token as 'refreshToken', created_at as 'createdAt', updated_at as 'updatedAt'
  FROM user_session
  WHERE id = LAST_INSERT_ID();
  `,
  getUserSession: `
  SELECT id, user_id as 'userId', refresh_token as 'refreshToken', remember_me as 'rememberMe', created_at as 'createdAt', updated_at as 'updatedAt'
  FROM user_session
  WHERE user_id = ?;
  `,
  deleteUserSession: `
  SET @userId = ?;
  DELETE FROM user_session
  WHERE user_id = @userId;
  `,
  createResetPasswordUID: `
  INSERT INTO user_reset_password (user_id, reset_password_uid)
  VALUES (? , ?);
  `,
  deleteResetPasswordUID: `
  DELETE from user_reset_password
  WHERE user_id = ?
  `,
  getResetPasswordUIDByUserId: `
  SELECT user_id as 'userId', reset_password_uid, created_at as 'createdAt'
  FROM user_reset_password
  WHERE user_id = ?
  `,
  getResetPasswordUID: `
  SELECT user_id as 'userId', reset_password_uid, created_at as 'createdAt'
  FROM user_reset_password
  WHERE reset_password_uid = ?
  `,
  resetPassword: `
  SET @userId = ?;
  UPDATE user
  SET password = ?
  WHERE id = @userId;
  DELETE FROM user_reset_password
  WHERE user_id = @userId;
  `,
  getLoginTypes: `
  SET @user_id = (SELECT id from user where email = ?);
  SELECT EXISTS(
    SELECT id FROM user
    WHERE id = @user_id
    AND password != 'oauth'
    ) as 'email',
  EXISTS(
    SELECT id FROM oauth
    WHERE user_id = @user_id
    AND type = 'google'
    ) as 'google',
  EXISTS(
    SELECT id FROM oauth
    WHERE user_id = @user_id
    AND type = 'linked_in'
    ) as 'linked_in';
  `,
  createOAuth: `
  INSERT INTO oauth(user_id, type, token)
  VALUES(?, ?, ?);
  SELECT user.id, 
    first_name as 'firstName', 
    last_name as 'lastName', 
    email, 
    password, 
    user.created_at as 'createdAt', 
    user.updated_at as 'updatedAt'
  FROM user
  LEFT JOIN oauth
  ON user.id = oauth.user_id
  WHERE oauth.id = LAST_INSERT_ID();
  `,

  updatePassword: `
    UPDATE user
    SET password = ?
    WHERE id = ?;
  `,
  getRegistrationUID: `
    SELECT uid
    FROM registration_uid
    WHERE user_id = ?
  `,
  createRegistrationUID: `
    INSERT INTO registration_uid(user_id, uid),
    VALUES(?, ?)
  `,
  deleteRegistrationUID: `
    DELETE FROM registration_uid
    WHERE user_id = ?;
  `,
  deleteUser: `
    DELETE FROM user
    WHERE id = ?
  `
};
