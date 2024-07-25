import express from 'express'

import { docsRouter } from './docs'
import { authRouter } from '../api/auth/authRouter'
import { projectRouter } from '../api/project/projectRouter'
import { userRouter } from '../api/user/userRouter'
import { notificationRouter } from '../api/notification/notificationRouter'

const router = express.Router()

router.use('/api-docs', docsRouter)
router.use('/auth', authRouter)
router.use('/user', userRouter)
router.use('/project', projectRouter)
router.use('/notification', notificationRouter)

export default router
