import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm'
  
  @Entity()
  export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string
  
    @Column({ type: 'varchar', length: 36 })
    firstName: string
  
    @Column({ type: 'varchar', length: 36 })
    lastName: string
  
    @Column({ type: 'varchar', length: 255 })
    email: string
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    password?: string | null

    @Column({ type: 'varchar', length: 255, nullable: true })
    profileImage?: string | null
  
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
  
    constructor(
      firstName: string,
      lastName: string,
      email: string,
      profileImage: string
    ) {
      this.firstName = firstName
      this.lastName = lastName
      this.email = email
      this.profileImage = profileImage
    }
  }
  