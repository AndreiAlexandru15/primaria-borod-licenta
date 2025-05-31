'use client';

import React, { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';

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
  Download, 
  FileText, 
  Calendar, 
  User, 
  Edit,
  Trash2,
  X,
  ExternalLink
} from "lucide-react";

// Import componentele existente
import { EditeazaInregistrareModal } from './editeaza-inregistrare-modal';
import { ConfirmDeleteModal, deleteConfigs } from './confirm-delete-modal';

// PDF Styles for @react-pdf/renderer
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#2563eb',
  },
  section: {
    marginBottom: 15,
    padding: 10,
    border: '1 solid #e5e7eb',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
    borderBottom: '1 solid #d1d5db',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
    color: '#6b7280',
  },
  value: {
    width: '60%',
    color: '#111827',
  },
  objectText: {
    marginTop: 5,
    lineHeight: 1.4,
    color: '#374151',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 10,
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
  },
});

// PDF Document Component
const InregistrarePDFDocument = ({ inregistrare }) => {
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
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>
          Raport Înregistrare Document
        </Text>

        {/* Informații Generale */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informații Generale</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Data înregistrare:</Text>
            <Text style={styles.value}>{formatDate(inregistrare?.dataInregistrare)}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Data document:</Text>
            <Text style={styles.value}>{formatDate(inregistrare?.dataFisier)}</Text>
          </View>
          
          {inregistrare?.numarInregistrare && (
            <View style={styles.row}>
              <Text style={styles.label}>Număr înregistrare:</Text>
              <Text style={styles.value}>{inregistrare.numarInregistrare}</Text>
            </View>
          )}
          
          {inregistrare?.numarDocument && (
            <View style={styles.row}>
              <Text style={styles.label}>Număr document:</Text>
              <Text style={styles.value}>{inregistrare.numarDocument}</Text>
            </View>
          )}
        </View>

        {/* Expeditor/Destinatar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expeditor/Destinatar</Text>
          
          {inregistrare?.expeditor && (
            <View style={styles.row}>
              <Text style={styles.label}>Expeditor:</Text>
              <Text style={styles.value}>{inregistrare.expeditor}</Text>
            </View>
          )}
          
          {inregistrare?.destinatarNume && (
            <View style={styles.row}>
              <Text style={styles.label}>Destinatar:</Text>
              <Text style={styles.value}>
                {inregistrare.destinatarNume}
                {inregistrare.destinatarFunctie && ` (${inregistrare.destinatarFunctie})`}
              </Text>
            </View>
          )}
        </View>

        {/* Obiect */}
        {inregistrare?.obiect && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Obiect</Text>
            <Text style={styles.objectText}>{inregistrare.obiect}</Text>
          </View>
        )}

        {/* Observații */}
        {inregistrare?.observatii && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observații</Text>
            <Text style={styles.objectText}>{inregistrare.observatii}</Text>
          </View>
        )}

        {/* Confidențialitate */}
        {inregistrare?.confidentialitateFisierDenumire && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confidențialitate</Text>
            <Text style={styles.value}>{inregistrare.confidentialitateFisierDenumire}</Text>
          </View>
        )}

        {/* Document atașat */}
        {inregistrare?.document && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Document Atașat</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Nume fișier:</Text>
              <Text style={styles.value}>{inregistrare.document.name || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tip fișier:</Text>
              <Text style={styles.value}>{inregistrare.document.type || 'N/A'}</Text>
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          Generat la {new Date().toLocaleDateString('ro-RO')} {new Date().toLocaleTimeString('ro-RO')}
        </Text>
      </Page>
    </Document>
  );
};

// Component pentru previzualizarea documentelor
const DocumentPreview = ({ document }) => {
  const getFileType = (fileName, mimeType) => {
    if (!fileName && !mimeType) return 'unknown';
    
    if (mimeType) {
      if (mimeType.includes('pdf')) return 'pdf';
      if (mimeType.includes('image')) return 'image';
      if (mimeType.includes('text')) return 'text';
      if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    }
    
    if (fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase();
      if (['pdf'].includes(extension)) return 'pdf';
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) return 'image';
      if (['txt', 'rtf'].includes(extension)) return 'text';
      if (['doc', 'docx', 'odt'].includes(extension)) return 'document';
    }
    
    return 'unknown';
  };

  const fileType = getFileType(document.name, document.type);

  if (fileType === 'pdf') {
    return (
      <iframe
        src={document.url}
        className="w-full h-full border-0"
        title="Document Preview"
      />
    );
  }

  if (fileType === 'image') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <img
          src={document.url}
          alt="Document Preview"
          className="max-w-full max-h-full object-contain"
        />
      </div>
    );
  }

  if (fileType === 'text') {
    return (
      <iframe
        src={document.url}
        className="w-full h-full border-0 bg-white"
        title="Document Preview"
      />
    );
  }

  // Pentru alte tipuri de fișiere care nu pot fi previzualizate
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2">Previzualizare indisponibilă</p>
        <p className="text-sm text-gray-500 mb-4">
          Acest tip de fișier nu poate fi previzualizat în browser
        </p>
        <p className="text-sm text-gray-500">
          {document.name}
        </p>
      </div>
    </div>
  );
};

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
            <div className="w-[70%] border-r flex flex-col min-h-0">
              <div className="p-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Document Atașat
                  </h3>
                  
                  {inregistrare?.document && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewDocument}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Deschide în Tab Nou
                      </Button>
                      
                      <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Descarcă Document
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1 p-4 pt-0 min-h-0">
                {inregistrare?.document ? (
                  <div className="h-full border rounded-lg overflow-hidden bg-gray-50">
                    <DocumentPreview document={inregistrare.document} />
                  </div>
                ) : (
                  <div className="h-full border rounded-lg overflow-hidden bg-gray-50">
                    <PDFViewer width="100%" height="100%">
                      <InregistrarePDFDocument inregistrare={inregistrare} />
                    </PDFViewer>
                  </div>
                )}
              </div>
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