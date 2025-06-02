// lib/audit.js
// Utility pentru audit logging în aplicația E-Registratură
// Conform Legii nr. 201/2024 și Ghidul Digitalizării - Arhivele Naționale

import { prisma } from '@/lib/prisma'
// Importă prisma pentru interacțiunea cu baza de date

// Constante pentru acțiuni de audit
export const AUDIT_ACTIONS = {  // Utilizatori
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
  
  // Departamente
  CREATE_DEPARTMENT: 'CREATE_DEPARTMENT',
  UPDATE_DEPARTMENT: 'UPDATE_DEPARTMENT',
  DELETE_DEPARTMENT: 'DELETE_DEPARTMENT',
  
  // Registre
  CREATE_REGISTRU: 'CREATE_REGISTRU',
  UPDATE_REGISTRU: 'UPDATE_REGISTRU',
  DELETE_REGISTRU: 'DELETE_REGISTRU',
    // Înregistrări
  CREATE_INREGISTRARE: 'CREATE_INREGISTRARE',
  UPDATE_INREGISTRARE: 'UPDATE_INREGISTRARE',
  DELETE_INREGISTRARE: 'DELETE_INREGISTRARE',
  FINALIZE_INREGISTRARE: 'FINALIZE_INREGISTRARE',
  CANCEL_INREGISTRARE: 'CANCEL_INREGISTRARE',
    // Fișiere și documente
  UPLOAD_FILE: 'UPLOAD_FILE',
  DOWNLOAD_FILE: 'DOWNLOAD_FILE',
  DELETE_FILE: 'DELETE_FILE',
  UPDATE_FILE: 'UPDATE_FILE',
  ASSOCIATE_FILE: 'ASSOCIATE_FILE',
  OCR_PROCESS: 'OCR_PROCESS',
  AI_PROCESS: 'AI_PROCESS',
  
  // Roluri și permisiuni
  CREATE_ROL: 'CREATE_ROL',
  UPDATE_ROL: 'UPDATE_ROL',
  DELETE_ROL: 'DELETE_ROL',
  ASSIGN_ROL: 'ASSIGN_ROL',
  REVOKE_ROL: 'REVOKE_ROL',
  CREATE_PERMISIUNE: 'CREATE_PERMISIUNE',
  UPDATE_PERMISIUNE: 'UPDATE_PERMISIUNE',
  DELETE_PERMISIUNE: 'DELETE_PERMISIUNE',    // Categorii și tipuri documente
  CREATE_CATEGORIE: 'CREATE_CATEGORIE',
  UPDATE_CATEGORIE: 'UPDATE_CATEGORIE',
  DELETE_CATEGORIE: 'DELETE_CATEGORIE',
  CREATE_CATEGORIE_DOCUMENT: 'CREATE_CATEGORIE_DOCUMENT',
  UPDATE_CATEGORIE_DOCUMENT: 'UPDATE_CATEGORIE_DOCUMENT',
  DELETE_CATEGORIE_DOCUMENT: 'DELETE_CATEGORIE_DOCUMENT',
  CREATE_TIP_DOCUMENT: 'CREATE_TIP_DOCUMENT',
  UPDATE_TIP_DOCUMENT: 'UPDATE_TIP_DOCUMENT',
  DELETE_TIP_DOCUMENT: 'DELETE_TIP_DOCUMENT',
  
  // Confidențialitate
  CREATE_CONFIDENTIALITATE: 'CREATE_CONFIDENTIALITATE',
  UPDATE_CONFIDENTIALITATE: 'UPDATE_CONFIDENTIALITATE',
  DELETE_CONFIDENTIALITATE: 'DELETE_CONFIDENTIALITATE',
  
  // Sistem
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
 * @returns {Object} - Object with ipAddress and userAgent
 */
function getRequestInfo(req = null) {
  let ipAddress = 'unknown'
  let userAgent = 'unknown'

  try {
    if (req) {
      // For pages directory API routes or direct request object
      if (req.headers) {
        ipAddress = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.headers['cf-connecting-ip'] ||
                   req.connection?.remoteAddress ||
                   req.socket?.remoteAddress ||
                   'unknown'
        userAgent = req.headers['user-agent'] || 'unknown'
      }
    } else {
      // For app directory (Server Components) - conditional import
      try {
        const { headers } = require('next/headers')
        const headersList = headers()
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

    // Handle comma-separated IPs (x-forwarded-for can contain multiple IPs)
    if (ipAddress && ipAddress.includes(',')) {
      ipAddress = ipAddress.split(',')[0].trim()
    }
  } catch (error) {
    console.warn('Could not get request info:', error.message)
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
    const {
      action,
      userId,
      entityType,
      entityId,
      details = {},
      ipAddress,
      userAgent,
      oldData,
      newData
    } = auditData    // Validare date obligatorii
    if (!action) {
      throw new Error('Action este obligatoriu pentru audit log')
    }      // Pentru acțiuni de securitate (login failed, etc.), userId poate fi null
    const allowNullUserActions = [
      AUDIT_ACTIONS.LOGIN_FAILED, 
      AUDIT_ACTIONS.LOGIN_SUCCESS,
      AUDIT_ACTIONS.CREATE_CATEGORIE_DOCUMENT,
      AUDIT_ACTIONS.UPDATE_CATEGORIE_DOCUMENT,
      AUDIT_ACTIONS.DELETE_CATEGORIE_DOCUMENT
    ]
    if (!userId && !allowNullUserActions.includes(action)) {
      throw new Error('UserId este obligatoriu pentru audit log (exceptând acțiunile de securitate)')
    }// Construiește obiectul de date pentru audit
    const auditEntry = {
      actiune: action,
      utilizatorId: userId || null, // Permite null pentru acțiuni de securitate
      detalii: {
        ...details,
        ...(oldData && { oldData }),
        ...(newData && { newData }),
        timestamp: new Date().toISOString()
      },
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      createdAt: new Date()
    }

    // Mapează entityType la câmpurile corespunzătoare din schema
    if (entityType && entityId) {
      switch (entityType) {
        case ENTITY_TYPES.FISIER:
          auditEntry.fisierId = entityId
          break
        case ENTITY_TYPES.INREGISTRARE:
          auditEntry.inregistrareId = entityId
          break
        // Pentru alte tipuri de entități, adaugă ID-ul în detalii
        default:
          auditEntry.detalii.entityType = entityType
          auditEntry.detalii.entityId = entityId
      }
    }

    // Creează înregistrarea în baza de date
    const auditLog = await prisma.auditLog.create({
      data: auditEntry,
      include: {
        utilizator: {
          select: {
            id: true,
            nume: true,
            prenume: true,
            email: true,
            functie: true
          }
        },
        fisier: entityType === ENTITY_TYPES.FISIER ? {
          select: {
            id: true,
            numeOriginal: true,
            tipMime: true
          }
        } : false
      }
    })

    return auditLog
  } catch (error) {
    console.error('Eroare la crearea audit log:', error)
    throw error
  }
}

/**
 * Funcție helper pentru API routes din pages directory
 * @param {Request} req - Request object din Next.js pages API
 * @param {Object} auditData - Datele pentru audit (fără IP și User Agent)
 * @returns {Promise<Object>} - Înregistrarea de audit creată
 */
export async function createAuditLogFromRequest(req, auditData) {
  try {
    const { ipAddress, userAgent } = getRequestInfo(req)

    return await createAuditLog({
      ...auditData,
      ipAddress,
      userAgent
    })
  } catch (error) {
    console.error('Error creating audit log from request:', error)
    throw error
  }
}

/**
 * Funcție pentru app directory (Server Components)
 * @param {Object} auditData - Datele pentru audit
 * @returns {Promise<Object>} - Înregistrarea de audit creată
 */
export async function createAuditLogFromServerComponent(auditData) {
  try {
    const { ipAddress, userAgent } = getRequestInfo() // No req parameter for app directory

    return await createAuditLog({
      ...auditData,
      ipAddress,
      userAgent
    })
  } catch (error) {
    console.error('Error creating audit log from server component:', error)
    throw error
  }
}

/**
 * Funcție pentru logarea acțiunilor de autentificare
 * @param {string} userId - ID-ul utilizatorului
 * @param {string} action - LOGIN sau LOGOUT
 * @param {string} [ipAddress] - Adresa IP
 * @param {string} [userAgent] - User agent
 * @param {Object} [details] - Detalii suplimentare
 */
export async function logAuthAction(userId, action, ipAddress, userAgent, details = {}) {
  return await createAuditLog({
    action,
    userId,
    entityType: ENTITY_TYPES.USER,
    entityId: userId,
    details: {
      ...details,
      authAction: true
    },
    ipAddress,
    userAgent
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
  const { ipAddress, userAgent } = getRequestInfo(req)
  
  return await createAuditLog({
    action,
    userId,
    entityType: ENTITY_TYPES.FISIER,
    entityId: fisierId,
    details,
    ipAddress,
    userAgent
  })
}

/**
 * Funcție pentru logarea acțiunilor asupra înregistrărilor
 * @param {string} action - Acțiunea
 * @param {string} userId - ID-ul utilizatorului
 * @param {string} inregistrareId - ID-ul înregistrării
 * @param {Object} [oldData] - Datele vechi (pentru UPDATE)
 * @param {Object} [newData] - Datele noi (pentru CREATE/UPDATE)
 * @param {Object} [details] - Detalii suplimentare
 * @param {Request} [req] - Request object pentru IP și User Agent
 */
export async function logInregistrareAction(action, userId, inregistrareId, oldData, newData, details = {}, req = null) {
  const { ipAddress, userAgent } = getRequestInfo(req)
  
  return await createAuditLog({
    action,
    userId,
    entityType: ENTITY_TYPES.INREGISTRARE,
    entityId: inregistrareId,
    oldData,
    newData,
    details,
    ipAddress,
    userAgent
  })
}

/**
 * Funcție pentru logarea acțiunilor asupra utilizatorilor
 * @param {string} action - Acțiunea
 * @param {string} performedByUserId - ID-ul utilizatorului care execută acțiunea
 * @param {string} targetUserId - ID-ul utilizatorului asupra căruia se execută acțiunea
 * @param {Object} [oldData] - Datele vechi
 * @param {Object} [newData] - Datele noi
 * @param {Object} [details] - Detalii suplimentare
 * @param {Request} [req] - Request object pentru IP și User Agent
 */
export async function logUserAction(action, performedByUserId, targetUserId, oldData, newData, details = {}, req = null) {
  const { ipAddress, userAgent } = getRequestInfo(req)
  
  return await createAuditLog({
    action,
    userId: performedByUserId,
    entityType: ENTITY_TYPES.USER,
    entityId: targetUserId,
    oldData,
    newData,
    details: {
      ...details,
      targetUserId
    },
    ipAddress,
    userAgent
  })
}

/**
 * Funcție pentru logarea acțiunilor de sistem
 * @param {string} action - Acțiunea de sistem
 * @param {string} userId - ID-ul utilizatorului care execută acțiunea
 * @param {Object} [details] - Detalii despre acțiunea de sistem
 * @param {Request} [req] - Request object pentru IP și User Agent
 */
export async function logSystemAction(action, userId, details = {}, req = null) {
  const { ipAddress, userAgent } = getRequestInfo(req)
  
  return await createAuditLog({
    action,
    userId,
    entityType: ENTITY_TYPES.SYSTEM,
    details: {
      ...details,
      systemAction: true
    },
    ipAddress,
    userAgent
  })
}

/**
 * Funcție pentru obținerea statisticilor de audit
 * @param {Object} filters - Filtre pentru statistici
 * @returns {Promise<Object>} - Statistici de audit
 */
export async function getAuditStatistics(filters = {}) {
  try {
    const { startDate, endDate, userId } = filters
    const where = {}

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    if (userId) where.utilizatorId = userId

    const [
      totalActions,
      actionsByType,
      userActions,
      recentActions
    ] = await Promise.all([
      // Total acțiuni
      prisma.auditLog.count({ where }),
      
      // Acțiuni grupate pe tip
      prisma.auditLog.groupBy({
        by: ['actiune'],
        where,
        _count: true,
        orderBy: { _count: { actiune: 'desc' } }
      }),
      
      // Acțiuni pe utilizator
      prisma.auditLog.groupBy({
        by: ['utilizatorId'],
        where,
        _count: true,
        orderBy: { _count: { utilizatorId: 'desc' } },
        take: 10
      }),
      
      // Acțiuni recente
      prisma.auditLog.findMany({
        where,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          utilizator: {
            select: {
              nume: true,
              prenume: true,
              email: true
            }
          }
        }
      })
    ])

    return {
      totalActions,
      actionsByType,
      userActions,
      recentActions
    }
  } catch (error) {
    console.error('Eroare la obținerea statisticilor de audit:', error)
    throw error
  }
}

/**
 * Cleanup function pentru închiderea conexiunii Prisma
 */
export async function closeAuditConnection() {
  await prisma.$disconnect()
}