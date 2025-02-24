import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { User } from '@api/user/userModel'
import { UserSessionStatus } from './interface'

@Entity()
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  userId: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User

  @Column({ type: 'varchar', length: 255 })
  refreshToken: string

  @Column({ type: 'timestamp' })
  expiresAt: Date

  @Column({
    type: 'enum',
    enum: UserSessionStatus,
    default: UserSessionStatus.ACTIVE,
  })
  status!: UserSessionStatus

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt!: Date

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt!: Date

  constructor(userId: string, refreshToken: string, expiresAt: Date) {
    this.userId = userId
    this.refreshToken = refreshToken
    this.expiresAt = expiresAt
  }
}
