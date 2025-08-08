import { AsyncResponse, IServiceMethod } from '../../interface'
import { RoleType } from '../role/interface'
import { Role } from '../role/roleModel'

export interface ICreateUserRole extends IServiceMethod {
  userId: number
  roleType: RoleType
}

export interface IGetRolesForUser {
  userId: number
}

export interface IUserRoleService {
  createUserRole(params: ICreateUserRole): AsyncResponse<null>
  getRolesForUser(params: IGetRolesForUser): AsyncResponse<Role[]>
}
