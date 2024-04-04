import { UserStatus } from './interface'

export const UserQueries = {
  getUserById: `
  SELECT id, 
    first_name as 'firstName', 
    last_name as 'lastName', 
    email, 
    password, 
    created_at as 'createdAt', 
    updated_at as 'updatedAt'
  FROM user 
  WHERE id = ?
  AND status != ${UserStatus.DELETED}
  `,
  getUserByEmail: `
  SELECT id, 
    first_name as 'firstName', 
    last_name as 'lastName', 
    email, 
    password, 
    created_at as 'createdAt', 
    updated_at as 'updatedAt'
  FROM user 
  WHERE email = ?
  AND status != ${UserStatus.DELETED}
`,
  createUser: `
    INSERT INTO user(first_name, last_name, email, password)
    VALUES(?, ?, ?, ?, ?);
    SELECT id, 
      first_name as 'firstName', 
      last_name as 'lastName', 
      email, 
      password, 
      created_at as 'createdAt', 
      updated_at as 'updatedAt'
    FROM user
    WHERE id = LAST_INSERT_ID();
  `,
  setUserStatus: `
    UPDATE user
    SET status = ?
    WHERE id = ?
  `,
  getProfile: `
    SELECT id, first_name as 'firstName', last_name as 'lastName'
    FROM user
    WHERE id = ?
    AND status != ${UserStatus.DELETED}
  `,
  editProfile: `
  SET @user_id = ?;
  UPDATE profile 
  SET first_name = ?,
  last_name = ?,
  email = ?,
  WHERE id = @user_id;
  SELECT id, first_name as 'firstName', last_name as 'lastName'
  FROM user
  WHERE id = @user_id
  AND status != ${UserStatus.DELETED}
  `
}
