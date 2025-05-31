"use client";
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export function FileUploadModal({ isOpen, onOpenChange, onUploadComplete }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  // Mutation pentru upload
  const uploadMutation = useMutation({
    mutationFn: async (fileData) => {
      const formData = new FormData();
      formData.append("file", fileData.file);

      const response = await axios.post("/api/fisiere", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          
          setUploadedFiles(prev =>
            prev.map(f =>
              f.id === fileData.id
                ? { ...f, progress, status: "uploading" }
                : f
            )
          );
        },
      });

      return response.data;
    },
    onSuccess: (data, variables) => {
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === variables.id
            ? { ...f, progress: 100, status: "success", result: data.data }
            : f
        )
      );
      
      // Invalidează cache-ul pentru a reîncărca lista
      queryClient.invalidateQueries({ queryKey: ["fisiere"] });
    },
    onError: (error, variables) => {
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === variables.id
            ? { ...f, status: "error", error: error.message }
            : f
        )
      );
    },
  });

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      status: "pending",
      progress: 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections,
  } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
      'text/*': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadAllFiles = async () => {
    setIsUploading(true);
    
    const pendingFiles = uploadedFiles.filter(f => f.status === "pending");
    
    for (const fileData of pendingFiles) {
      await uploadMutation.mutateAsync(fileData);
    }
    
    setIsUploading(false);
  };

  const resetAndClose = () => {
    setUploadedFiles([]);
    setIsUploading(false);
    onOpenChange(false);
    
    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "uploading":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const pendingFilesCount = uploadedFiles.filter(f => f.status === "pending").length;
  const successFilesCount = uploadedFiles.filter(f => f.status === "success").length;
  const errorFilesCount = uploadedFiles.filter(f => f.status === "error").length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload documente
          </DialogTitle>
          <DialogDescription>
            Încărcați documente noi în sistem. Acestea vor fi salvate ca neînregistrate și pot fi asociate ulterior cu înregistrări.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Zona de drag & drop */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive && !isDragReject
                ? "border-blue-400 bg-blue-50"
                : isDragReject
                ? "border-red-400 bg-red-50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <Upload className={`h-12 w-12 ${isDragActive ? "text-blue-500" : "text-gray-400"}`} />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isDragActive
                    ? "Eliberați fișierele aici"
                    : "Trageți fișierele aici sau click pentru a selecta"}
                </p>
                <p className="text-sm text-gray-500">
                  Acceptă: PDF, Word, Excel, Imagini, Text (max 10MB per fișier)
                </p>
              </div>
            </div>
          </div>

          {/* Erori de validare fișiere */}
          {fileRejections.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p>Următoarele fișiere nu au putut fi adăugate:</p>
                  {fileRejections.map(({ file, errors }) => (
                    <div key={file.name} className="text-sm">
                      <strong>{file.name}</strong>: {errors.map(e => e.message).join(", ")}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Lista fișierelor selectate */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Fișiere selectate ({uploadedFiles.length})</h3>
                <div className="flex gap-2">
                  {successFilesCount > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {successFilesCount} încărcate
                    </Badge>
                  )}
                  {errorFilesCount > 0 && (
                    <Badge variant="destructive">
                      {errorFilesCount} erori
                    </Badge>
                  )}
                  {pendingFilesCount > 0 && (
                    <Badge variant="outline">
                      {pendingFilesCount} în așteptare
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {uploadedFiles.map((fileData) => (
                  <div
                    key={fileData.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex-shrink-0">
                      {getStatusIcon(fileData.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{fileData.name}</p>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(fileData.size)}
                        </span>
                      </div>
                      
                      {fileData.status === "uploading" && (
                        <Progress value={fileData.progress} className="mt-1 h-1" />
                      )}
                      
                      {fileData.status === "error" && (
                        <p className="text-xs text-red-600 mt-1">{fileData.error}</p>
                      )}
                    </div>

                    {(fileData.status === "pending" || fileData.status === "error") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileData.id)}
                        className="flex-shrink-0 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Butoane de acțiune */}
          <div className="flex justify-between gap-4">
            <Button variant="outline" onClick={resetAndClose}>
              {successFilesCount > 0 ? "Închide" : "Anulează"}
            </Button>
            
            <div className="flex gap-2">
              {pendingFilesCount > 0 && (
                <Button
                  onClick={uploadAllFiles}
                  disabled={isUploading || pendingFilesCount === 0}
                  className="min-w-32"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Încărcare...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Încarcă fișierele ({pendingFilesCount})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}