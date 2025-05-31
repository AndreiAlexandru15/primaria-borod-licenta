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
  X,
  Plus,
  Hash,
  FolderOpen
} from "lucide-react";

// Import componentele existente
import { PDFViewerContainer } from './pdf-viewer';

const VizualizeazaDocumentModal = ({ 
  document, 
  children, 
  isOpen, 
  onOpenChange, 
  onEdit, 
  onDelete,
  onRegister,
  onRefresh
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownload = () => {
    if (document?.url) {
      const link = document.createElement('a');
      link.href = document.url;
      link.download = document.numeOriginal || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleViewDocument = () => {
    if (document?.url) {
      window.open(document.url, '_blank');
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(document);
    }
  };

  const handleRegister = () => {
    if (onRegister) {
      onRegister(document);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !document?.id) return;
    
    setIsDeleting(true);
    try {
      await onDelete(document.id);
      onRefresh?.();
      onOpenChange?.(false);
    } catch (error) {
      console.error('Eroare la ștergerea documentului:', error);
    } finally {
      setIsDeleting(false);
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

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
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
              Vizualizare Document
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 min-h-0">
            {/* Partea stângă - Document Preview (70% width) */}
            <div className="w-[70%] border-r">
              <PDFViewerContainer
                document={{
                  url: document?.url,
                  name: document?.numeOriginal,
                  type: document?.tipFisier
                }}
                title="Document"
                showActions={true}
                onDownload={document?.url ? handleDownload : null}
                onOpenInNewTab={document?.url ? handleViewDocument : null}
                className="h-full"
              />
            </div>

            {/* Partea dreaptă - Detalii document (30% width) */}
            <div className="w-[30%] flex flex-col min-h-0">
              <div className="p-4 border-b flex-shrink-0">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Detalii Document
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
                      <div>
                        <p className="text-sm font-medium">Nume document</p>
                        <p className="text-sm text-gray-600 break-words">{document?.numeOriginal || 'N/A'}</p>
                      </div>

                      <Separator />

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Data fișier</p>
                          <p className="text-sm text-gray-600">{formatDate(document?.dataFisier)}</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Data încărcare</p>
                          <p className="text-sm text-gray-600">{formatDate(document?.createdAt)}</p>
                        </div>
                      </div>

                      {document?.extensie && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm font-medium">Tip fișier</p>
                            <Badge variant="outline" className="mt-1">
                              {document.extensie.toUpperCase()}
                            </Badge>
                          </div>
                        </>
                      )}

                      {document?.marime && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm font-medium">Mărime fișier</p>
                            <p className="text-sm text-gray-600">{formatFileSize(document.marime)}</p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Categorie */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Categorie
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {document?.categorie?.nume ? (
                        <Badge variant="outline">{document.categorie.nume}</Badge>
                      ) : (
                        <span className="text-sm text-gray-600">Fără categorie</span>
                      )}
                    </CardContent>
                  </Card>

                  {/* Status înregistrare */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Status Înregistrare
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {document?.inregistrareId ? (
                        <>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                            ✓ Înregistrat
                          </Badge>
                          {document?.inregistrare?.numarInregistrare && (
                            <>
                              <Separator />
                              <div>
                                <p className="text-sm font-medium">Număr înregistrare</p>
                                <Badge variant="secondary" className="font-mono mt-1">
                                  {document.inregistrare.numarInregistrare}
                                </Badge>
                              </div>
                            </>
                          )}
                          {document?.inregistrare?.dataInregistrare && (
                            <>
                              <Separator />
                              <div>
                                <p className="text-sm font-medium">Data înregistrare</p>
                                <p className="text-sm text-gray-600">{formatDate(document.inregistrare.dataInregistrare)}</p>
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                          ⏳ Neînregistrat
                        </Badge>
                      )}
                    </CardContent>
                  </Card>

                  {/* Descriere/Note */}
                  {document?.descriere && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Descriere</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {document.descriere}
                        </p>
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
              {/* Buton pentru înregistrare (doar pentru documente neînregistrate) */}
              {!document?.inregistrareId && onRegister && (
                <Button variant="default" onClick={handleRegister}>
                  <Plus className="h-4 w-4 mr-2" />
                  Înregistrează
                </Button>
              )}
              
              {onEdit && (
                <Button variant="outline" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editează
                </Button>
              )}
              
              {onDelete && (
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={!!document?.inregistrareId || isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Se șterge...' : (document?.inregistrareId ? 'Nu se poate șterge' : 'Șterge')}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { VizualizeazaDocumentModal };