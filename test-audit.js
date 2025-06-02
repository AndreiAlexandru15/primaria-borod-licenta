// Test script to verify audit logging for UPDATE and DELETE operations
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

async function testAuditLogging() {
  console.log('🧪 Testing audit logging for UPDATE and DELETE operations...')
  
  try {
    // 1. First, let's check if we have any existing registrations
    const existingRegistration = await prisma.inregistrare.findFirst({
      include: {
        registru: true,
        fisiere: true
      }
    })
    
    if (!existingRegistration) {
      console.log('❌ No existing registrations found. Please create a registration first.')
      return
    }
    
    console.log(`✅ Found registration: ${existingRegistration.numarInregistrare}`)
    
    // 2. Check audit logs before our test
    const auditLogsBefore = await prisma.auditLog.count({
      where: {
        entityType: 'INREGISTRARE',
        entityId: existingRegistration.id
      }
    })
    
    console.log(`📊 Audit logs before test: ${auditLogsBefore}`)
    
    // 3. Create a mock request object for testing
    const mockUser = await prisma.utilizator.findFirst()
    if (!mockUser) {
      console.log('❌ No users found. Cannot create mock request.')
      return
    }
    
    const token = jwt.sign({ userId: mockUser.id }, process.env.JWT_SECRET || 'test-secret')
    
    const mockRequest = {
      headers: new Map([
        ['authorization', `Bearer ${token}`],
        ['user-agent', 'Test Script'],
        ['x-forwarded-for', '127.0.0.1']
      ]),
      url: `http://localhost:3000/api/inregistrari/${existingRegistration.id}`,
      method: 'PUT'
    }
    
    // 4. Import and test the audit function directly
    const { createAuditLogFromRequest, AUDIT_ACTIONS } = await import('../lib/audit.js')
    
    // Test UPDATE audit logging
    console.log('🔄 Testing UPDATE audit logging...')
    await createAuditLogFromRequest(mockRequest, {
      action: AUDIT_ACTIONS.UPDATE_INREGISTRARE,
      userId: mockUser.id,
      entityType: 'INREGISTRARE',
      entityId: existingRegistration.id,
      oldData: { obiect: 'Old object' },
      newData: { obiect: 'New object' },
      details: {
        success: true,
        test: true,
        changes: { obiect: true }
      }
    })
    
    // Test DELETE audit logging
    console.log('🗑️ Testing DELETE audit logging...')
    await createAuditLogFromRequest(mockRequest, {
      action: AUDIT_ACTIONS.DELETE_INREGISTRARE,
      userId: mockUser.id,
      entityType: 'INREGISTRARE',
      entityId: existingRegistration.id,
      oldData: {
        id: existingRegistration.id,
        numarInregistrare: existingRegistration.numarInregistrare,
        obiect: existingRegistration.obiect
      },
      newData: null,
      details: {
        success: true,
        test: true,
        deletedInregistrareInfo: {
          numarInregistrare: existingRegistration.numarInregistrare
        }
      }
    })
    
    // 5. Check audit logs after our test
    const auditLogsAfter = await prisma.auditLog.findMany({
      where: {
        entityType: 'INREGISTRARE',
        entityId: existingRegistration.id
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    
    console.log(`📊 Audit logs after test: ${auditLogsAfter.length}`)
    console.log('📝 Recent audit logs:')
    auditLogsAfter.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.action} - ${log.createdAt.toISOString()}`)
      console.log(`     User: ${log.userId}`)
      console.log(`     Details: ${log.details ? JSON.stringify(JSON.parse(log.details), null, 2) : 'null'}`)
    })
    
    if (auditLogsAfter.length > auditLogsBefore) {
      console.log('✅ Audit logging is working correctly!')
    } else {
      console.log('❌ Audit logging might not be working properly.')
    }
    
  } catch (error) {
    console.error('❌ Error testing audit logging:', error)
    
    // Check if it's a foreign key constraint error
    if (error.message.includes('foreign key constraint')) {
      console.log('\n🔍 Foreign key constraint error detected. Checking for orphaned audit logs...')
      
      // Find orphaned audit logs
      const orphanedLogs = await prisma.auditLog.findMany({
        where: {
          entityType: 'INREGISTRARE',
          entityId: {
            not: null
          }
        },
        include: {
          inregistrare: true
        }
      })
      
      const actuallyOrphaned = orphanedLogs.filter(log => !log.inregistrare)
      
      console.log(`Found ${actuallyOrphaned.length} orphaned audit logs`)
      
      if (actuallyOrphaned.length > 0) {
        console.log('🧹 Cleaning up orphaned audit logs...')
        await prisma.auditLog.deleteMany({
          where: {
            id: {
              in: actuallyOrphaned.map(log => log.id)
            }
          }
        })
        console.log('✅ Orphaned audit logs cleaned up')
      }
    }
  } finally {
    await prisma.$disconnect()
  }
}

testAuditLogging()
