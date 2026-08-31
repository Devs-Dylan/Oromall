import { handleApiRequest } from './apiRouter.mjs'
import { getTable, getDatabase } from './db.mjs'

async function simulateRequest(method, url, body = null, headers = {}) {
  return new Promise((resolve) => {
    const req = {
      method,
      url,
      headers: { host: 'localhost:3001', ...headers },
      on(event, handler) {
        if (event === 'data' && body) {
          handler(Buffer.from(JSON.stringify(body)))
        }
        if (event === 'end') {
          handler()
        }
      }
    }

    let responseStatusCode = 200
    let responseHeaders = {}
    let responseBody = ''

    const res = {
      writeHead(status, hdrs) {
        responseStatusCode = status
        responseHeaders = hdrs
      },
      end(chunk) {
        if (chunk) responseBody += chunk
        try {
          const parsed = JSON.parse(responseBody)
          resolve({ status: responseStatusCode, headers: responseHeaders, data: parsed })
        } catch {
          resolve({ status: responseStatusCode, headers: responseHeaders, data: responseBody })
        }
      }
    }

    handleApiRequest(req, res)
  })
}

async function runE2ETests() {
  console.log('🚀 DÉMARRAGE DES TESTS D\'INTÉGRATION END-TO-END SERVEUR & BDD...\n')

  // 1. Test Inscription d'un Associé Terrain avec les 5 champs
  const testAssocEmail = `associe.e2e.${Date.now()}@oromall.cm`
  console.log('1️⃣ Test Inscription Associé Terrain avec 5 champs requis...')
  const regAssocRes = await simulateRequest('POST', '/api/auth/register', {
    name: 'Samuel - Agent Terrain Molyko',
    email: testAssocEmail,
    password: 'AssociePassword2026@',
    role: 'associate',
    whatsapp_number: '699887766',
    momo_number: '677112233'
  })

  console.log('Status code:', regAssocRes.status)
  if (regAssocRes.status !== 201 || !regAssocRes.data.success) {
    throw new Error(`Échec test 1: ${JSON.stringify(regAssocRes.data)}`)
  }
  console.log('✅ Associé créé avec succès:', regAssocRes.data.user.id, regAssocRes.data.user.email)
  const assocToken = regAssocRes.data.token

  // 2. Test Connexion Associé
  console.log('\n2️⃣ Test Connexion de l\'Associé créé...')
  const loginAssocRes = await simulateRequest('POST', '/api/auth/login', {
    email: testAssocEmail,
    password: 'AssociePassword2026@'
  })
  if (loginAssocRes.status !== 200 || loginAssocRes.data.user.role !== 'associate') {
    throw new Error(`Échec test 2: ${JSON.stringify(loginAssocRes.data)}`)
  }
  console.log('✅ Connexion Associé réussie:', loginAssocRes.data.user.name, 'Rôle:', loginAssocRes.data.user.role)

  // 3. Test Publication d'un Logement par l'Associé
  console.log('\n3️⃣ Test Enregistrement Logement en base de données...')
  const housingRes = await simulateRequest('POST', '/api/housing', {
    title: 'Chambre Étudiante Moderne - Proche Université',
    description: 'Chambre individuelle moderne avec salle d\'eau et compteur individuel.',
    price: 35000,
    price_type: 'month',
    city: 'Yaoundé',
    neighborhood: 'Ngoa-Ekellé',
    submitted_by_associate_id: loginAssocRes.data.user.id,
    submitted_by_associate_name: loginAssocRes.data.user.name,
    status: 'pending_review'
  })
  if (housingRes.status !== 201 || !housingRes.data.success) {
    throw new Error(`Échec test 3: ${JSON.stringify(housingRes.data)}`)
  }
  console.log('✅ Logement persisté en BDD:', housingRes.data.data.id, housingRes.data.data.title)

  // 4. Test Synchronisation Globale Frontend (GET /api/sync)
  console.log('\n4️⃣ Test Récupération globale synchronisée (/api/sync)...')
  const syncRes = await simulateRequest('GET', '/api/sync')
  if (syncRes.status !== 200 || !syncRes.data.data.users.some(u => u.email === testAssocEmail)) {
    throw new Error(`Échec test 4: ${JSON.stringify(syncRes.data)}`)
  }
  console.log('✅ Sync globale validée (Total users:', syncRes.data.data.users.length, 'Total housing:', syncRes.data.data.housing.length, ')')

  // 5. Nettoyage des données de test
  console.log('\n5️⃣ Nettoyage des données de test...')
  getTable('users').delete(loginAssocRes.data.user.id)
  getTable('housing').delete(housingRes.data.data.id)
  console.log('✅ Données de test nettoyées.')

  console.log('\n🎉 TOUS LES TESTS D\'INTÉGRATION SERVEUR ONT RÉUSSI AVEC SUCCÈS ! 🚀')
}

runE2ETests().catch(err => {
  console.error('❌ ERREUR LORS DU TEST :', err)
  process.exit(1)
})
