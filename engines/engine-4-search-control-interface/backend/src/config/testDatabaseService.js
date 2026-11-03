import { databaseService } from '../services/databaseService.js'

try {
  const roles = await databaseService.getRoles()
  const departments = await databaseService.getDepartments()

  console.log('Roles:')
  console.table(roles)

  console.log('Departments:')
  console.table(departments)
} catch (error) {
  console.error('Database service test failed:', error.message)
  process.exitCode = 1
}
