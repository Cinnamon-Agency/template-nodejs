import { AsyncResponse } from '@common'
import { Role } from '@prisma/client'

export enum RoleType {
  ADMIN = 'admin',
  USER = 'user',
}

export interface IGetRoleByRoleType {
  roleType: RoleType
}

export interface IRoleService {
  getRoleByRoleType(params: IGetRoleByRoleType): AsyncResponse<Role>
}
