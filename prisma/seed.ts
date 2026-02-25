import { PrismaClient } from '@prisma/client'
import { hashString } from '../src/services/bcrypt'
import 'dotenv/config'
const prisma = new PrismaClient()


async function main() {

  const roles = ['SUPERADMIN', 'ADMIN', 'USER']

  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName }
    })
  }



  const superAdminEmail = 'superadmin@gmail.com'
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail }
  })

  if (!existingSuperAdmin) {
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPERADMIN' }
    })

    if (!superAdminRole) {
      throw new Error(
        'SuperAdmin role not found. Please ensure roles are created first.'
      )
    }

    const superAdminPassword = process.env.SUPERADMIN_PASSWORD
    if (!superAdminPassword) {
      throw new Error(
        'SUPERADMIN_PASSWORD environment variable is required. Set it before running seed.'
      )
    }
    const hashedPassword = await hashString(superAdminPassword)

    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        password: hashedPassword,
        authType: 'USER_PASSWORD',
      }
    })

    await prisma.userRole.create({
      data: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
      }
    })

    console.log('✅ Super admin user created successfully')
  } else {
    console.log('ℹ️  Super admin user already exists')
  }

}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
