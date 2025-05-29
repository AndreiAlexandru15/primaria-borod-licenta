/**
 * Sistem de notificări stilizate pentru aplicația e-registratură
 * @fileoverview Funcții utilitare pentru toast-uri cu stiluri personalizate
 */

import { toast } from "sonner"

/**
 * Configurații pentru stilurile de notificări
 */
const NOTIFICATION_STYLES = {
  success: {
    style: {
      background: '#f0f9ff',
      border: '1px solid #22c55e',
      color: '#15803d'
    },
    icon: '✅'
  },
  error: {
    style: {
      background: '#fef2f2',
      border: '1px solid #ef4444',
      color: '#dc2626'
    },
    icon: '❌'
  },
  warning: {
    style: {
      background: '#fffbeb',
      border: '1px solid #f59e0b',
      color: '#d97706'
    },
    icon: '⚠️'
  },
  info: {
    style: {
      background: '#f0f9ff',
      border: '1px solid #3b82f6',
      color: '#2563eb'
    },
    icon: 'ℹ️'
  },
  loading: {
    style: {
      background: '#f8fafc',
      border: '1px solid #64748b',
      color: '#475569'
    },
    icon: '⏳'
  }
}

/**
 * Notificare de succes
 * @param {string} message - Mesajul notificării
 * @param {Object} options - Opțiuni suplimentare pentru toast
 */
export const notifySuccess = (message, options = {}) => {
  return toast.success(message, {
    duration: 4000,
    style: NOTIFICATION_STYLES.success.style,
    icon: NOTIFICATION_STYLES.success.icon,
    ...options
  })
}

/**
 * Notificare de eroare
 * @param {string} message - Mesajul notificării
 * @param {Object} options - Opțiuni suplimentare pentru toast
 */
export const notifyError = (message, options = {}) => {
  return toast.error(message, {
    duration: 5000,
    style: NOTIFICATION_STYLES.error.style,
    icon: NOTIFICATION_STYLES.error.icon,
    ...options
  })
}

/**
 * Notificare de avertisment
 * @param {string} message - Mesajul notificării
 * @param {Object} options - Opțiuni suplimentare pentru toast
 */
export const notifyWarning = (message, options = {}) => {
  return toast(message, {
    duration: 4500,
    style: NOTIFICATION_STYLES.warning.style,
    icon: NOTIFICATION_STYLES.warning.icon,
    ...options
  })
}

/**
 * Notificare informativă
 * @param {string} message - Mesajul notificării
 * @param {Object} options - Opțiuni suplimentare pentru toast
 */
export const notifyInfo = (message, options = {}) => {
  return toast(message, {
    duration: 3500,
    style: NOTIFICATION_STYLES.info.style,
    icon: NOTIFICATION_STYLES.info.icon,
    ...options
  })
}

/**
 * Notificare de încărcare
 * @param {string} message - Mesajul notificării
 * @param {Object} options - Opțiuni suplimentare pentru toast
 */
export const notifyLoading = (message, options = {}) => {
  return toast.loading(message, {
    style: NOTIFICATION_STYLES.loading.style,
    icon: NOTIFICATION_STYLES.loading.icon,
    ...options
  })
}

/**
 * Închide o notificare specifică
 * @param {string|number} toastId - ID-ul toast-ului de închis
 */
export const dismissNotification = (toastId) => {
  toast.dismiss(toastId)
}

/**
 * Închide toate notificările
 */
export const dismissAllNotifications = () => {
  toast.dismiss()
}

/**
 * Notificare pentru operațiuni CRUD
 */
export const crudNotifications = {
  /**
   * Notificare pentru creare cu succes
   * @param {string} entityName - Numele entității create
   * @param {string} itemName - Numele specific al itemului
   */
  created: (entityName, itemName) => {
    return notifySuccess(`${entityName} "${itemName}" a fost creat${entityName.includes('a') ? 'ă' : ''} cu succes!`)
  },

  /**
   * Notificare pentru actualizare cu succes
   * @param {string} entityName - Numele entității actualizate
   * @param {string} itemName - Numele specific al itemului
   */
  updated: (entityName, itemName) => {
    return notifySuccess(`${entityName} "${itemName}" a fost actualizat${entityName.includes('a') ? 'ă' : ''} cu succes!`)
  },

  /**
   * Notificare pentru ștergere cu succes
   * @param {string} entityName - Numele entității șterse
   * @param {string} itemName - Numele specific al itemului
   */
  deleted: (entityName, itemName) => {
    return notifySuccess(`${entityName} "${itemName}" a fost șters${entityName.includes('a') ? 'ă' : ''} cu succes!`)
  },

  /**
   * Notificare pentru eroare la operațiuni CRUD
   * @param {string} operation - Operația (creare, actualizare, ștergere)
   * @param {string} entityName - Numele entității
   * @param {string} errorMessage - Mesajul de eroare
   */
  error: (operation, entityName, errorMessage) => {
    return notifyError(`Eroare la ${operation} ${entityName}: ${errorMessage}`)
  },

  /**
   * Notificare pentru încărcare
   * @param {string} operation - Operația în curs
   * @param {string} entityName - Numele entității
   */
  loading: (operation, entityName) => {
    return notifyLoading(`Se ${operation} ${entityName}...`)
  }
}

/**
 * Notificări pentru validări
 */
export const validationNotifications = {
  /**
   * Câmp obligatoriu
   * @param {string} fieldName - Numele câmpului
   */
  required: (fieldName) => {
    return notifyWarning(`Câmpul "${fieldName}" este obligatoriu`)
  },

  /**
   * Format invalid
   * @param {string} fieldName - Numele câmpului
   * @param {string} expectedFormat - Formatul așteptat
   */
  invalidFormat: (fieldName, expectedFormat) => {
    return notifyWarning(`Câmpul "${fieldName}" nu are un format valid. Format așteptat: ${expectedFormat}`)
  },

  /**
   * Lungime minimă
   * @param {string} fieldName - Numele câmpului
   * @param {number} minLength - Lungimea minimă
   */
  minLength: (fieldName, minLength) => {
    return notifyWarning(`Câmpul "${fieldName}" trebuie să aibă minim ${minLength} caractere`)
  },

  /**
   * Lungime maximă
   * @param {string} fieldName - Numele câmpului
   * @param {number} maxLength - Lungimea maximă
   */
  maxLength: (fieldName, maxLength) => {
    return notifyWarning(`Câmpul "${fieldName}" nu poate depăși ${maxLength} caractere`)
  }
}

/**
 * Notificări pentru permisiuni
 */
export const permissionNotifications = {
  /**
   * Acces interzis
   * @param {string} action - Acțiunea interzisă
   */
  denied: (action) => {
    return notifyError(`Nu ai permisiunea să ${action}`)
  },

  /**
   * Sesiune expirată
   */
  sessionExpired: () => {
    return notifyWarning('Sesiunea ta a expirat. Te rugăm să te autentifici din nou.')
  },

  /**
   * Autentificare necesară
   */
  authRequired: () => {
    return notifyInfo('Pentru a continua, te rugăm să te autentifici.')
  }
}
