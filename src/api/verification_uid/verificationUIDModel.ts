import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
  } from 'typeorm'
  import { User } from '../user/userModel'
  import { VerificationUIDType } from './interface'
  
  @Entity()
  export class VerificationUID {
    @PrimaryGeneratedColumn('uuid')
    id!: string
  
    @Column()
    userId!: string
  
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User
  
    @Column({ type: 'varchar', length: 36 })
    uid: string
  
    @Column({ type: 'varchar', length: 255 })
    hash: string
  
    @Column({ type: 'enum', enum: VerificationUIDType })
    type: VerificationUIDType
  
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
  
    constructor(userId: string, uid: string, hash: string, type: VerificationUIDType) {
      this.userId = userId
      this.uid = uid
      this.hash = hash
      this.type = type
    }
  }
  