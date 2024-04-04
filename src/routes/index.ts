import express from 'express'

import { authRouter } from '../api/auth/authRouter'
import { profileRouter } from '../api/profile/profileRouter'
import { messageRouter } from '../api/messages/messageRouter'

const router = express.Router()

router.use('/auth', authRouter)
router.use('/profile', profileRouter)
router.use('/messages', messageRouter)

export default router
