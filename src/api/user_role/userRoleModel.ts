import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
  Unique
} from 'typeorm'
import { User } from '../user/userModel'
import { Role } from '../role/roleModel'

@Entity()
@Unique(['userId', 'roleId'])
export class UserRole {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column({ type: 'integer' })
  userId!: number

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User

  @Column({ type: 'integer' })
  roleId!: number

  @ManyToOne(() => Role, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'role_id' })
  role!: Role

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

  constructor(userId: number, roleId: number) {
    this.userId = userId
    this.roleId = roleId
  }
}
