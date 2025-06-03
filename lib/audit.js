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
    }

    // Obține informațiile de request dacă nu sunt furnizate
    const requestInfo = await getRequestInfo()
    
    const auditEntry = {
      actiune: auditData.action,
      utilizatorId: auditData.userId,
      tipEntitate: auditData.entityType || null,
      entitateId: auditData.entityId || null,
      adresaIP: auditData.ipAddress || requestInfo.ipAddress,
      userAgent: auditData.userAgent || requestInfo.userAgent,
      detalii: auditData.details ? JSON.stringify(auditData.details) : null,
      dateleVechi: auditData.oldData ? JSON.stringify(auditData.oldData) : null,
      dateleNoi: auditData.newData ? JSON.stringify(auditData.newData) : null,
      timestamp: new Date()
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