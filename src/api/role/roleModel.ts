import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn
} from 'typeorm'
import { UserRole } from '../user_role/userRoleModel'
import { RoleType } from './interface'

@Entity()
export class Role {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column({ type: 'enum', enum: RoleType, unique: true })
  role!: RoleType

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  @JoinColumn({ name: 'role_id' })
  userRoles!: UserRole[]

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)'
  })
  createdAt!: Date

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)'
  })
  updatedAt!: Date

  constructor(role: RoleType) {
    this.role = role
  }
}
