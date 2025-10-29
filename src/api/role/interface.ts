import { AsyncResponse } from '@common'
import { Role, RoleType } from '@prisma/client'


export interface IGetRoleByRoleType {
  roleType: RoleType
}

export interface IRoleService {
  getRoleByRoleType(params: IGetRoleByRoleType): AsyncResponse<Role>
}
