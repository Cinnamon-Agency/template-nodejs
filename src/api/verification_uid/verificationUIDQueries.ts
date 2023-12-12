export const VerificationUIDQueries = {
  getVerificationUID: `
    SELECT uid
    FROM verification_uid
    WHERE user_id = ?
    AND type = ?
  `,
  createVerificationUID: `
    INSERT INTO verification_uid(user_id, uid, type),
    VALUES(?, ?, ?)
  `,
  deleteVerificationUID: `
    DELETE FROM verification_uid
    WHERE user_id = ?
    AND type = ?;
  `
};
