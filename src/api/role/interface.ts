import { AsyncResponse } from '../../interface'
import { Role } from './roleModel'

export enum RoleType {
  ADMIN = 'admin',
  USER = 'user'
}

export interface IGetRoleByRoleType {
  roleType: RoleType
}

export interface IRoleService {
  getRoleByRoleType(params: IGetRoleByRoleType): AsyncResponse<Role>
}
