'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { FileText, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

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

// PDF Document Component pentru înregistrări
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

// Componenta principală PDFViewerContainer
const PDFViewerContainer = ({ 
  document = null, 
  pdfDocument = null, 
  title = "Document",
  showActions = true,
  className = "",
  onDownload = null,
  onOpenInNewTab = null 
}) => {
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (document?.url) {
      const link = document.createElement('a');
      link.href = document.url;
      link.download = document.name || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleViewDocument = () => {
    if (onOpenInNewTab) {
      onOpenInNewTab();
    } else if (document?.url) {
      window.open(document.url, '_blank');
    }
  };

  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      {showActions && (
        <div className="p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {title}
            </h3>
            
            {(document || onDownload || onOpenInNewTab) && (
              <div className="flex items-center gap-2">
                {(document?.url || onOpenInNewTab) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewDocument}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Deschide în Tab Nou
                  </Button>
                )}
                
                {(document?.url || onDownload) && (
                  <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Descarcă Document
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="flex-1 px-4 pb-4 min-h-0">
        {document ? (
          <div className="h-full border rounded-lg overflow-hidden bg-gray-50">
            <DocumentPreview document={document} />
          </div>
        ) : pdfDocument ? (
          <div className="h-full border rounded-lg overflow-hidden bg-gray-50">
            <PDFViewer width="100%" height="100%">
              {pdfDocument}
            </PDFViewer>
          </div>
        ) : (
          <div className="h-full border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Nu există document de afișat</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { 
  PDFViewerContainer, 
  InregistrarePDFDocument, 
  DocumentPreview,
  styles as pdfStyles 
};