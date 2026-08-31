import { getTable, getDatabase, saveDatabase } from './db.mjs'

console.log('--- TEST DU MOTEUR DE BASE DE DONNÉES SERVEUR ---')
const usersTable = getTable('users')
console.log(`Nombre total d'utilisateurs en base : ${usersTable.list().length}`)

// Create a test user in DB
const testUser = usersTable.create({
  name: 'Associé Test Backend',
  email: `test.associe.${Date.now()}@oromall.cm`,
  password: 'Password2026@',
  role: 'associate',
  account_type: 'client',
  phone: '699001122',
  whatsapp_number: '699001122',
  momo_number: '677001122'
})

console.log('✅ Utilisateur créé dans la base de données :', testUser)

const found = usersTable.get(testUser.id)
console.log('✅ Utilisateur relu depuis le stockage persistant :', found?.name, found?.email)

// Clean test user
usersTable.delete(testUser.id)
console.log('✅ Nettoyage utilisateur de test effectué.')
console.log('--- TEST RÉUSSI AVEC SUCCÈS ---')
