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
  Download, 
  FileText, 
  Calendar, 
  User, 
  MapPin, 
  Clock,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  X
} from "lucide-react";

const VizualizeazaInregistrareModal = ({ 
  inregistrare, 
  children, 
  isOpen, 
  onOpenChange, 
  onEdit, 
  onDelete 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  
  const isPDF = inregistrare?.document?.type === 'application/pdf' || 
               inregistrare?.document?.name?.toLowerCase().endsWith('.pdf');

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

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleEdit = () => {
    onEdit?.(inregistrare);
    onOpenChange?.(false);
  };

  const handleDelete = () => {
    onDelete?.(inregistrare);
    onOpenChange?.(false);
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
          {/* Partea stângă - PDF Viewer (70% width) */}
          <div className="w-[70%] border-r flex flex-col min-h-0">
            <div className="p-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Document Atașat
                </h3>
                
                {/* PDF Controls */}
                {isPDF && inregistrare?.document && (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleZoomOut}
                      disabled={zoom <= 50}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600 min-w-[50px] text-center">
                      {zoom}%
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleZoomIn}
                      disabled={zoom >= 200}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handlePrevPage}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600 min-w-[40px] text-center">
                      {currentPage}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleNextPage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 p-4 pt-0 min-h-0">
              {inregistrare?.document ? (
                <div className="h-full flex flex-col">
                  {isPDF ? (
                    <>
                      <div className="flex-1 border rounded-lg overflow-auto min-h-0 bg-gray-50">
                        <iframe
                          src={`${inregistrare.document.url}#page=${currentPage}&zoom=${zoom}`}
                          className="w-full h-full"
                          title="PDF Viewer"
                          style={{ 
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: 'top left'
                          }}
                        />
                      </div>
                      <div className="mt-4 flex justify-center flex-shrink-0">
                        <Button onClick={handleDownload} variant="outline" className="gap-2">
                          <Download className="h-4 w-4" />
                          Descarcă PDF
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-center">
                        <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-4">
                          Documentul nu poate fi previzualizat
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          {inregistrare.document.name}
                        </p>
                        <Button onClick={handleDownload} className="gap-2">
                          <Download className="h-4 w-4" />
                          Descarcă Document
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center text-gray-500">
                    <FileText className="h-16 w-16 mx-auto mb-4" />
                    <p>Nu există document atașat</p>
                  </div>
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
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Șterge
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { VizualizeazaInregistrareModal };