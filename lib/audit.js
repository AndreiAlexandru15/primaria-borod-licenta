// lib/audit.js
// Utility pentru audit logging în aplicația E-Registratură
// Conform Legii nr. 201/2024 și Ghidul Digitalizării - Arhivele Naționale
import { prisma } from '@/lib/prisma'

// Constante pentru acțiuni de audit
export const AUDIT_ACTIONS = {
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  ACTIVATE_USER: 'ACTIVATE_USER',
  DEACTIVATE_USER: 'DEACTIVATE_USER',
  LOGIN: 'LOGIN',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_RESET: 'PASSWORD_RESET',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  CREATE_DEPARTMENT: 'CREATE_DEPARTMENT',
  UPDATE_DEPARTMENT: 'UPDATE_DEPARTMENT',
  DELETE_DEPARTMENT: 'DELETE_DEPARTMENT',
  CREATE_REGISTRU: 'CREATE_REGISTRU',
  UPDATE_REGISTRU: 'UPDATE_REGISTRU',
  DELETE_REGISTRU: 'DELETE_REGISTRU',
  CREATE_INREGISTRARE: 'CREATE_INREGISTRARE',
  UPDATE_INREGISTRARE: 'UPDATE_INREGISTRARE',
  DELETE_INREGISTRARE: 'DELETE_INREGISTRARE',
  FINALIZE_INREGISTRARE: 'FINALIZE_INREGISTRARE',
  CANCEL_INREGISTRARE: 'CANCEL_INREGISTRARE',
  UPLOAD_FILE: 'UPLOAD_FILE',
  DOWNLOAD_FILE: 'DOWNLOAD_FILE',
  DELETE_FILE: 'DELETE_FILE',
  UPDATE_FILE: 'UPDATE_FILE',
  ASSOCIATE_FILE: 'ASSOCIATE_FILE',
  OCR_PROCESS: 'OCR_PROCESS',
  AI_PROCESS: 'AI_PROCESS',
  CREATE_ROL: 'CREATE_ROL',
  UPDATE_ROL: 'UPDATE_ROL',
  DELETE_ROL: 'DELETE_ROL',
  ASSIGN_ROL: 'ASSIGN_ROL',
  REVOKE_ROL: 'REVOKE_ROL',
  CREATE_PERMISIUNE: 'CREATE_PERMISIUNE',
  UPDATE_PERMISIUNE: 'UPDATE_PERMISIUNE',
  DELETE_PERMISIUNE: 'DELETE_PERMISIUNE',
  CREATE_CATEGORIE: 'CREATE_CATEGORIE',
  UPDATE_CATEGORIE: 'UPDATE_CATEGORIE',
  DELETE_CATEGORIE: 'DELETE_CATEGORIE',
  CREATE_CATEGORIE_DOCUMENT: 'CREATE_CATEGORIE_DOCUMENT',
  UPDATE_CATEGORIE_DOCUMENT: 'UPDATE_CATEGORIE_DOCUMENT',
  DELETE_CATEGORIE_DOCUMENT: 'DELETE_CATEGORIE_DOCUMENT',
  CREATE_TIP_DOCUMENT: 'CREATE_TIP_DOCUMENT',
  UPDATE_TIP_DOCUMENT: 'UPDATE_TIP_DOCUMENT',
  DELETE_TIP_DOCUMENT: 'DELETE_TIP_DOCUMENT',
  CREATE_CONFIDENTIALITATE: 'CREATE_CONFIDENTIALITATE',
  UPDATE_CONFIDENTIALITATE: 'UPDATE_CONFIDENTIALITATE',
  DELETE_CONFIDENTIALITATE: 'DELETE_CONFIDENTIALITATE',
  SYSTEM_BACKUP: 'SYSTEM_BACKUP',
  SYSTEM_RESTORE: 'SYSTEM_RESTORE',
  SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE',
  DATA_EXPORT: 'DATA_EXPORT',
  DATA_IMPORT: 'DATA_IMPORT'
}

// Tipuri de entități pentru audit
export const ENTITY_TYPES = {
  USER: 'USER',
  DEPARTMENT: 'DEPARTMENT',
  REGISTRU: 'REGISTRU',
  INREGISTRARE: 'INREGISTRARE',
  FISIER: 'FISIER',
  ROL: 'ROL',
  PERMISIUNE: 'PERMISIUNE',
  CATEGORIE: 'CATEGORIE',
  CATEGORIE_DOCUMENT: 'CATEGORIE_DOCUMENT',
  TIP_DOCUMENT: 'TIP_DOCUMENT',
  CONFIDENTIALITATE: 'CONFIDENTIALITATE',
  SYSTEM: 'SYSTEM'
}

/**
 * Helper function to safely get headers and request info
 * @param {Request} req - Optional request object from pages API
 * @returns {Promise<Object>} - Object with ipAddress and userAgent
 */
async function getRequestInfo(req = null) {
  let ipAddress = 'unknown'
  let userAgent = 'unknown'

  try {
    if (req) {
      // For pages API routes
      ipAddress = req.headers['x-forwarded-for'] ||
                 req.headers['x-real-ip'] ||
                 req.headers['cf-connecting-ip'] ||
                 req.connection?.remoteAddress ||
                 'unknown'
      userAgent = req.headers['user-agent'] || 'unknown'
    } else {
      // For app directory API routes
      try {
        const { headers } = await import('next/headers')
        const headersList = await headers()
        ipAddress = headersList.get('x-forwarded-for') ||
                   headersList.get('x-real-ip') ||
                   headersList.get('cf-connecting-ip') ||
                   'unknown'
        userAgent = headersList.get('user-agent') || 'unknown'
      } catch (e) {
        // Headers not available or not in app directory, keep defaults
        console.warn('Headers not available:', e.message)
      }
    }
  } catch (error) {
    console.warn('Error getting request info:', error.message)
  }

  return { ipAddress, userAgent }
}

/**
 * Funcție principală pentru logarea acțiunilor de audit
 * @param {Object} auditData - Datele pentru audit
 * @param {string} auditData.action - Acțiunea executată (din AUDIT_ACTIONS)
 * @param {string} auditData.userId - ID-ul utilizatorului care execută acțiunea
 * @param {string} [auditData.entityType] - Tipul entității afectate
 * @param {string} [auditData.entityId] - ID-ul entității afectate
 * @param {Object} [auditData.details] - Detalii suplimentare despre acțiune
 * @param {string} [auditData.ipAddress] - Adresa IP (se obține automat în API routes)
 * @param {string} [auditData.userAgent] - User agent (se obține automat în API routes)
 * @param {Object} [auditData.oldData] - Datele vechi (pentru UPDATE)
 * @param {Object} [auditData.newData] - Datele noi (pentru CREATE/UPDATE)
 * @returns {Promise<Object>} - Înregistrarea de audit creată
 */
export async function createAuditLog(auditData) {
  try {
    // Validări
    if (!auditData.action || !auditData.userId) {
      throw new Error('Action și userId sunt obligatorii pentru audit log')
    }    // Obține informațiile de request dacă nu sunt furnizate
    const requestInfo = await getRequestInfo()
    
    const auditEntry = {
      actiune: auditData.action,
      utilizatorId: auditData.userId,
      fisierId: auditData.entityType === 'FISIER' ? auditData.entityId : null,
      inregistrareId: auditData.entityType === 'INREGISTRARE' ? auditData.entityId : null,
      ipAddress: auditData.ipAddress || requestInfo.ipAddress,
      userAgent: auditData.userAgent || requestInfo.userAgent,
      detalii: auditData.details ? JSON.stringify({
        ...auditData.details,
        entityType: auditData.entityType,
        entityId: auditData.entityId,
        oldData: auditData.oldData,
        newData: auditData.newData
      }) : null
    }

    // Creează înregistrarea de audit în baza de date
    const auditLog = await prisma.auditLog.create({
      data: auditEntry
    })

    return auditLog

  } catch (error) {
    console.error('Eroare la crearea audit log:', error)
    // Nu aruncăm eroarea pentru a nu întrerupe flow-ul principal
    return null
  }
}

/**
 * Funcție helper pentru API routes din pages directory
 * @param {Request} req - Request object din Next.js pages API
 * @param {Object} auditData - Datele pentru audit (fără IP și User Agent)
 * @returns {Promise<Object>} - Înregistrarea de audit creată
 */
export async function createAuditLogFromRequest(req, auditData) {
  const requestInfo = await getRequestInfo(req)
  
  return createAuditLog({
    ...auditData,
    ipAddress: requestInfo.ipAddress,
    userAgent: requestInfo.userAgent
  })
}

/**
 * Funcție helper pentru Server Components și App Router API routes
 * @param {Object} auditData - Datele pentru audit
 * @returns {Promise<Object>} - Înregistrarea de audit creată
 */
export async function createAuditLogFromServerComponent(auditData) {
  const requestInfo = await getRequestInfo()
  
  return createAuditLog({
    ...auditData,
    ipAddress: requestInfo.ipAddress,
    userAgent: requestInfo.userAgent
  })
}

/**
 * Funcție pentru logarea acțiunilor asupra fișierelor
 * @param {string} action - Acțiunea (UPLOAD_FILE, DOWNLOAD_FILE, etc.)
 * @param {string} userId - ID-ul utilizatorului
 * @param {string} fisierId - ID-ul fișierului
 * @param {Object} [details] - Detalii suplimentare
 * @param {Request} [req] - Request object pentru IP și User Agent
 */
export async function logFileAction(action, userId, fisierId, details = {}, req = null) {
  const requestInfo = await getRequestInfo(req)
  
  return await createAuditLog({
    action,
    userId,
    entityType: ENTITY_TYPES.FISIER,
    entityId: fisierId,
    details,
    ipAddress: requestInfo.ipAddress,
    userAgent: requestInfo.userAgent
  })
}

/**
 * Funcție pentru obținerea statisticilor de audit
 * @param {Object} [filters] - Filtrele pentru statistici
 * @param {string} [filters.startDate] - Data de început
 * @param {string} [filters.endDate] - Data de sfârșit
 * @param {string} [filters.userId] - ID-ul utilizatorului
 * @returns {Promise<Object>} - Statisticile de audit
 */
export async function getAuditStatistics(filters = {}) {
  try {
    const { startDate, endDate, userId } = filters
    
    // Construim where clause pentru filtrare
    const where = {}
    
    if (userId) {
      where.utilizatorId = userId
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    // Statistici generale
    const [
      totalLogs,
      uniqueUsers,
      topActions,
      logsByDate,
      logsByEntityType,
      loginStats
    ] = await Promise.all([
      // Total numărul de log-uri
      prisma.auditLog.count({ where }),
      
      // Numărul de utilizatori unici
      prisma.auditLog.findMany({
        where,
        select: { utilizatorId: true },
        distinct: ['utilizatorId']
      }).then(logs => logs.length),
      
      // Top acțiuni
      prisma.auditLog.groupBy({
        by: ['actiune'],
        where,
        _count: { actiune: true },
        orderBy: { _count: { actiune: 'desc' } },
        take: 10
      }),
      
      // Log-uri pe zi (ultimele 30 zile)
      prisma.auditLog.groupBy({
        by: ['createdAt'],
        where: {
          ...where,
          createdAt: {
            ...where.createdAt,
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 zile
          }
        },
        _count: { id: true }
      }),
      
      // Log-uri pe tip de entitate
      prisma.auditLog.groupBy({
        by: ['tipEntitate'],
        where,
        _count: { tipEntitate: true },
        orderBy: { _count: { tipEntitate: 'desc' } }
      }),
      
      // Statistici de login
      prisma.auditLog.groupBy({
        by: ['actiune'],
        where: {
          ...where,
          actiune: { in: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT'] }
        },
        _count: { actiune: true }
      })
    ])

    // Procesăm datele pentru grafice
    const dailyStats = {}
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    // Inițializăm cu 0 pentru toate zilele
    last30Days.forEach(date => {
      dailyStats[date] = 0
    })

    // Adăugăm log-urile existente
    logsByDate.forEach(log => {
      const date = new Date(log.createdAt).toISOString().split('T')[0]
      if (dailyStats[date] !== undefined) {
        dailyStats[date] = log._count.id
      }
    })

    // Calculăm rata de succes la login
    const loginSuccessCount = loginStats.find(s => s.actiune === 'LOGIN_SUCCESS')?._count?.actiune || 0
    const loginFailedCount = loginStats.find(s => s.actiune === 'LOGIN_FAILED')?._count?.actiune || 0
    const totalLoginAttempts = loginSuccessCount + loginFailedCount
    const successRate = totalLoginAttempts > 0 ? (loginSuccessCount / totalLoginAttempts * 100).toFixed(2) : 0

    return {
      overview: {
        totalLogs,
        uniqueUsers,
        period: {
          startDate: startDate || 'N/A',
          endDate: endDate || 'N/A'
        },
        loginSuccessRate: successRate
      },
      topActions: topActions.map(action => ({
        action: action.actiune,
        count: action._count.actiune
      })),
      dailyActivity: Object.entries(dailyStats).map(([date, count]) => ({
        date,
        count
      })),
      entityTypes: logsByEntityType.map(entity => ({
        type: entity.tipEntitate || 'SYSTEM',
        count: entity._count.tipEntitate
      })),
      loginStats: {
        successful: loginSuccessCount,
        failed: loginFailedCount,
        successRate: parseFloat(successRate)
      }
    }

  } catch (error) {
    console.error('Eroare la obținerea statisticilor de audit:', error)
    throw new Error('Failed to fetch audit statistics')
  }
}