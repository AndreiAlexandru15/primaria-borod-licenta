'use client';

import React, { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Calendar, 
  User, 
  Edit,
  Trash2,
  X
} from "lucide-react";

// Import componentele existente
import { EditeazaInregistrareModal } from './editeaza-inregistrare-modal';
import { ConfirmDeleteModal, deleteConfigs } from './confirm-delete-modal';
import { PDFViewerContainer, InregistrarePDFDocument } from './pdf-viewer';

const VizualizeazaInregistrareModal = ({ 
  inregistrare, 
  children, 
  isOpen, 
  onOpenChange, 
  onEdit, 
  onDelete,
  onRefresh,
  departamentId,
  registruId 
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownload = () => {
    if (inregistrare?.document?.url) {
      const link = document.createElement('a');
      link.href = inregistrare.document.url;
      link.download = inregistrare.document.name || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleViewDocument = () => {
    if (inregistrare?.document?.url) {
      window.open(inregistrare.document.url, '_blank');
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    onRefresh?.(); // Refresh lista
    onOpenChange?.(false); // Închide modala de vizualizare
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      if (onDelete && inregistrare?.id) {
        await onDelete(inregistrare.id);
        onRefresh?.(); // Refresh lista
        onOpenChange?.(false); // Închide modala de vizualizare
      }
    } catch (error) {
      console.error('Eroare la ștergerea înregistrării:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        {children && (
          <DialogTrigger asChild>
            {children}
          </DialogTrigger>
        )}
        <DialogContent 
          className="p-0 border bg-background shadow-lg duration-200 overflow-hidden fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '70vw',
            height: '90vh',
            maxWidth: 'none',
            maxHeight: '90vh',
            zIndex: 50
          }}
        >
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Vizualizare Înregistrare
            </DialogTitle>
          </DialogHeader>
            <div className="flex flex-1 min-h-0">
            {/* Partea stângă - Document Preview automat (70% width) */}
            <div className="w-[70%] border-r">
              <PDFViewerContainer
                document={inregistrare?.document}
                pdfDocument={!inregistrare?.document ? <InregistrarePDFDocument inregistrare={inregistrare} /> : null}
                title="Document Atașat"
                showActions={true}
                onDownload={inregistrare?.document ? handleDownload : null}
                onOpenInNewTab={inregistrare?.document ? handleViewDocument : null}
                className="h-full"
              />
            </div>

            {/* Partea dreaptă - Detalii înregistrare (30% width) */}
            <div className="w-[30%] flex flex-col min-h-0">
              <div className="p-4 border-b flex-shrink-0">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Detalii Înregistrare
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                <div className="space-y-4">
                  {/* Informații generale */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Informații Generale</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Data înregistrare</p>
                          <p className="text-sm text-gray-600">{formatDate(inregistrare?.dataInregistrare)}</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Data document</p>
                          <p className="text-sm text-gray-600">{formatDate(inregistrare?.dataFisier)}</p>
                        </div>
                      </div>

                      {inregistrare?.numarInregistrare && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm font-medium">Număr înregistrare</p>
                            <p className="text-sm text-gray-600">{inregistrare.numarInregistrare}</p>
                          </div>
                        </>
                      )}

                      {inregistrare?.numarDocument && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm font-medium">Număr document</p>
                            <p className="text-sm text-gray-600">{inregistrare.numarDocument}</p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Expeditor/Destinatar */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Expeditor/Destinatar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {inregistrare?.expeditor && (
                        <div>
                          <p className="text-sm font-medium">Expeditor</p>
                          <p className="text-sm text-gray-600">{inregistrare.expeditor}</p>
                        </div>
                      )}
                      
                      {inregistrare?.destinatarNume && (
                        <div>
                          <p className="text-sm font-medium">Destinatar</p>
                          <p className="text-sm text-gray-600">
                            {inregistrare.destinatarNume}
                            {inregistrare.destinatarFunctie && ` (${inregistrare.destinatarFunctie})`}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Obiect */}
                  {inregistrare?.obiect && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Obiect</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {inregistrare.obiect}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Observații */}
                  {inregistrare?.observatii && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Observații</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {inregistrare.observatii}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Confidențialitate */}
                  {inregistrare?.confidentialitateFisierDenumire && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Confidențialitate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="secondary">
                          {inregistrare.confidentialitateFisierDenumire}
                        </Badge>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer cu butoane de acțiuni */}
          <DialogFooter className="px-6 py-4 border-t flex-shrink-0 flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange?.(false)}>
                <X className="h-4 w-4 mr-2" />
                Închide
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editează
              </Button>
              <Button variant="destructive" onClick={handleDeleteClick}>
                <Trash2 className="h-4 w-4 mr-2" />
                Șterge
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de editare folosind EditeazaInregistrareModal */}
      <EditeazaInregistrareModal
        isOpen={showEditModal}
        onOpenChange={setShowEditModal}
        inregistrare={inregistrare}
        departamentId={departamentId}
        registruId={registruId}
        onSuccess={handleEditSuccess}
      />

      {/* Modal de confirmare ștergere folosind ConfirmDeleteModal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        config={{
          ...deleteConfigs.inregistrare,
          itemName: inregistrare?.numarInregistrare || 'Înregistrarea',
          onConfirm: handleDeleteConfirm
        }}
        isLoading={isDeleting}
      />
    </>
  );
};

export { VizualizeazaInregistrareModal };