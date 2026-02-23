import { generateUUID } from '../../src/services/uuid'

describe('UUID Service', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID string', () => {
      const uuid = generateUUID()
      
      expect(typeof uuid).toBe('string')
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    it('should generate different UUIDs on multiple calls', () => {
      const uuid1 = generateUUID()
      const uuid2 = generateUUID()
      
      expect(uuid1).not.toBe(uuid2)
    })

    it('should generate UUID of correct length', () => {
      const uuid = generateUUID()
      
      expect(uuid.length).toBe(36)
    })
  })
})
