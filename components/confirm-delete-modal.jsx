/**
 * Modal de confirmare pentru ștergere
 * @fileoverview Componentă modal reutilizabilă pentru confirmarea operațiunilor de ștergere
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, Trash2 } from "lucide-react"

/**
 * Modal de confirmare pentru ștergere
 * @param {Object} props - Proprietățile componentei
 * @param {boolean} props.isOpen - Starea de deschidere a modalului
 * @param {function} props.onClose - Funcția de închidere a modalului
 * @param {Object} props.config - Configurația modalului sau props individuale
 * @param {boolean} props.isLoading - Starea de încărcare
 */
export function ConfirmDeleteModal({
  isOpen,
  onClose,
  config = {},
  isLoading = false,
  // Props individuale pentru compatibilitate backwards
  onConfirm: directOnConfirm,
  title: directTitle,
  description: directDescription,
  itemName: directItemName,
  entityType: directEntityType = "element",
  warningMessage: directWarningMessage,
  isDangerous: directIsDangerous = false
}) {
  // Destructurăm din config sau folosim props-urile directe
  const {
    onConfirm = directOnConfirm,
    title = directTitle,
    description = directDescription,
    itemName = directItemName,
    entityType = directEntityType,
    warningMessage = directWarningMessage,
    isDangerous = directIsDangerous
  } = config
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      // Eroarea este gestionată în componenta părinte
    } finally {
      setIsConfirming(false)
    }
  }

  const handleClose = () => {
    if (!isConfirming && !isLoading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isDangerous ? 'bg-red-100' : 'bg-orange-100'}`}>
              <AlertTriangle className={`h-6 w-6 ${isDangerous ? 'text-red-600' : 'text-orange-600'}`} />
            </div>
            <div>
              <DialogTitle className="text-lg">
                {title || `Confirmă ștergerea ${entityType}`}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <DialogDescription className="text-base mb-4">
            {description || `Ești sigur că vrei să ștergi ${entityType} "${itemName}"?`}
          </DialogDescription>

          {warningMessage && (
            <div className={`p-3 rounded-lg mb-4 ${
              isDangerous 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <p className={`text-sm ${
                isDangerous ? 'text-red-800' : 'text-yellow-800'
              }`}>
                <strong>Atenție:</strong> {warningMessage}
              </p>
            </div>
          )}

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Element de șters:</strong>
            </p>
            <p className="font-medium text-gray-900">
              {itemName}
            </p>
          </div>

          {isDangerous && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>⚠️ Această acțiune nu poate fi anulată!</strong>
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isConfirming || isLoading}
          >
            Anulează
          </Button>
          <Button
            type="button"
            variant={isDangerous ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isConfirming || isLoading}
            className={!isDangerous ? "bg-red-600 hover:bg-red-700 text-white" : ""}
          >
            {(isConfirming || isLoading) ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Se șterge...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Șterge {entityType}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook pentru gestionarea modalului de ștergere
 * @returns {Object} Obiect cu starea și funcțiile pentru modal
 */
export function useConfirmDelete() {
  const [isOpen, setIsOpen] = useState(false)
  const [deleteConfig, setDeleteConfig] = useState({
    title: '',
    description: '',
    itemName: '',
    entityType: 'element',
    warningMessage: '',
    isDangerous: false,
    onConfirm: () => {}
  })

  const openDeleteModal = (config) => {
    setDeleteConfig(config)
    setIsOpen(true)
  }

  const closeDeleteModal = () => {
    setIsOpen(false)
    setTimeout(() => {
      setDeleteConfig({
        title: '',
        description: '',
        itemName: '',
        entityType: 'element',
        warningMessage: '',
        isDangerous: false,
        onConfirm: () => {}
      })
    }, 200)
  }

  return {
    isOpen,
    deleteConfig,
    openDeleteModal,
    closeDeleteModal
  }
}

/**
 * Configurații predefinite pentru diferite tipuri de entități
 */
export const deleteConfigs = {
  departament: {
    entityType: "departamentul",
    title: "Șterge Departament",
    warningMessage: "Toate registrele și documentele asociate vor fi de asemenea șterse.",
    isDangerous: true
  },
  
  registru: {
    entityType: "registrul",
    title: "Șterge Registru", 
    warningMessage: "Toate înregistrările din acest registru vor fi șterse.",
    isDangerous: true
  },
  
  inregistrare: {
    entityType: "înregistrarea",
    title: "Șterge Înregistrare",
    warningMessage: "Documentele asociate acestei înregistrări vor fi de asemenea șterse.",
    isDangerous: false
  },
  
  utilizator: {
    entityType: "utilizatorul",
    title: "Șterge Utilizator",
    warningMessage: "Utilizatorul va fi dezactivat și nu va mai putea accesa sistemul.",
    isDangerous: false
  },
  
  document: {
    entityType: "documentul",
    title: "Șterge Document",
    warningMessage: "Fișierul document va fi șters permanent din sistem.",
    isDangerous: true
  }
}
