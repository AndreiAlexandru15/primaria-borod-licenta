/**
 * Script pentru verificarea conexiunii la baza de date și status
 * @fileoverview Verifică conectivitatea și afișează informații despre baza de date
 */

import { prisma } from '../lib/prisma.js'

async function verificaConexiune() {
  try {
    console.log('🔍 Verificare conexiune la baza de date...')
    
    // Test conexiune
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Conexiune la baza de date: OK')
    
    // Verifică rolurile
    const roluri = await prisma.rol.findMany()
    console.log(`📋 Roluri în sistem: ${roluri.length}`)
    roluri.forEach(rol => {
      console.log(`   - ${rol.nume} (nivel ${rol.nivelAcces})`)
    })
    
    // Verifică permisiunile
    const permisiuni = await prisma.permisiune.findMany()
    console.log(`🔐 Permisiuni în sistem: ${permisiuni.length}`)
    
    // Verifică categoriile de documente
    const categorii = await prisma.categorieDocument.findMany()
    console.log(`📁 Categorii documente: ${categorii.length}`)
    categorii.forEach(cat => {
      console.log(`   - ${cat.nume} (${cat.cod})`)
    })
    
    // Verifică relațiile rol-permisiuni
    const rolPermisiuni = await prisma.rolPermisiune.findMany({
      include: {
        rol: true,
        permisiune: true
      }
    })
    console.log(`🔗 Relații rol-permisiuni: ${rolPermisiuni.length}`)
    
    console.log('\n✅ Baza de date este configurată corect!')
    
  } catch (error) {
    console.error('❌ Eroare la verificarea bazei de date:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verificaConexiune()
