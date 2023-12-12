import { Request } from 'express'
import Joi from 'joi'

export const getMessageBySlug = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        slug: Joi.string().required()
      })
      .options({ abortEarly: false }),
    input: {
      slug: req.params.slug
    }
  }
}
