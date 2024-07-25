import { Request } from 'express'
import Joi from 'joi'

export const createProjectSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        name: Joi.string().required(),
        description: Joi.string().required(),
        deadline: Joi.date().required(),
        mediaFiles: Joi.array()
          .items({
            mediaType: Joi.string().required(),
            mediaFileName: Joi.string().required()
          })
          .required()
      })
      .options({ abortEarly: false }),
    input: {
      name: req.body.name,
      description: req.body.description,
      deadline: req.body.deadline,
      mediaFiles: req.body.mediaFiles
    }
  }
}

export const getProjectsSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        page: Joi.number().required(),
        perPage: Joi.number().required()
      })
      .options({ abortEarly: false }),
    input: {
      page: req.query.page,
      perPage: req.query.perPage
    }
  }
}

export const getProjectByIdSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        id: Joi.string()
          .regex(
            /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
          )
          .required()
      })
      .options({ abortEarly: false }),
    input: {
      id: req.params.id
    }
  }
}
