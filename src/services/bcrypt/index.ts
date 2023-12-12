import bcrypt from 'bcrypt'
import config from '../../config'

export const hashString = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(config.SALT_ROUNDS)

  const hash = await bcrypt.hash(password, salt)

  return hash
}

export const compare = async (
  string: string,
  hash: string
): Promise<boolean> => {
  const matches = await bcrypt.compare(string, hash)

  return matches
}
