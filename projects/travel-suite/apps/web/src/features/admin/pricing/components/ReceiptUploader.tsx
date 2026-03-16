"use client";

import { useState, useCallback, useRef } from "react";
import { GlassModal } from "@/components/glass/GlassModal";
import { GlassButton } from "@/components/glass/GlassButton";
import { Upload, Loader2, CheckCircle, AlertCircle, Image as ImageIcon } from "lucide-react";
import { formatINR } from "@/lib/india/formats";
import type { ReceiptOcrResult } from "../types";

interface ReceiptUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onAmountExtracted: (amount: number, receiptId: string, receiptUrl: string) => void;
}

type UploadStatus = "idle" | "uploading" | "ocr-processing" | "extracted" | "error";

export function ReceiptUploader({
  isOpen,
  onClose,
  onAmountExtracted,
}: ReceiptUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<ReceiptOcrResult | null>(null);
  const [editedAmount, setEditedAmount] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setStatus("idle");
    setError(null);
    setUploadProgress(0);
    setSelectedFile(null);
    setPreviewUrl(null);
    setReceiptId(null);
    setReceiptUrl(null);
    setOcrResult(null);
    setEditedAmount("");
    setIsDragging(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const validateFile = (file: File): string | null => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      return "Only JPG, PNG, and PDF files are supported";
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return "File size exceeds 10MB limit";
    }

    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview URL for images
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setStatus("uploading");
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadRes = await fetch("/api/admin/pricing/receipts/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => ({}));
        throw new Error(body.error || `Upload failed: HTTP ${uploadRes.status}`);
      }

      const uploadData = await uploadRes.json();
      setReceiptId(uploadData.receipt_id);
      setReceiptUrl(uploadData.receipt_url);
      setUploadProgress(100);

      // Start OCR processing
      setStatus("ocr-processing");
      const ocrRes = await fetch("/api/admin/pricing/receipts/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt_id: uploadData.receipt_id }),
      });

      if (!ocrRes.ok) {
        const body = await ocrRes.json().catch(() => ({}));
        throw new Error(body.error || `OCR failed: HTTP ${ocrRes.status}`);
      }

      const ocrData = await ocrRes.json();
      setOcrResult(ocrData);
      setEditedAmount(String(ocrData.amount || 0));
      setStatus("extracted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  }, [selectedFile]);

  const handleConfirm = useCallback(() => {
    if (!receiptId || !receiptUrl) return;

    const finalAmount = parseFloat(editedAmount) || 0;
    onAmountExtracted(finalAmount, receiptId, receiptUrl);
    handleClose();
  }, [receiptId, receiptUrl, editedAmount, onAmountExtracted, handleClose]);

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return "text-green-600";
    if (confidence >= 0.7) return "text-yellow-600";
    return "text-orange-600";
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.9) return "High";
    if (confidence >= 0.7) return "Medium";
    return "Low";
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Receipt"
      size="md"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-600 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {status === "idle" && (
          <>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-white/20 bg-white/5 hover:border-primary/50 hover:bg-primary/5"
                }
              `}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm font-medium text-secondary mb-1">
                {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-text-muted">JPG, PNG, or PDF files only, up to 10MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl && (
              <div className="relative rounded-xl overflow-hidden bg-white/10 p-4">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="max-h-64 mx-auto object-contain rounded-lg"
                />
              </div>
            )}

            {selectedFile && (
              <div className="flex gap-3 justify-end">
                <GlassButton
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  Remove
                </GlassButton>
                <GlassButton variant="primary" onClick={handleUpload}>
                  <Upload className="w-4 h-4" />
                  Upload & Extract
                </GlassButton>
              </div>
            )}
          </>
        )}

        {status === "uploading" && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-sm font-medium text-secondary mb-2">Uploading receipt...</p>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-2">{uploadProgress}% complete</p>
          </div>
        )}

        {status === "ocr-processing" && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-sm font-medium text-secondary mb-1">Extracting amount from receipt...</p>
            <p className="text-xs text-text-muted">This may take a few seconds</p>
          </div>
        )}

        {status === "extracted" && ocrResult && (
          <>
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 mb-1">Amount extracted successfully!</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-900">
                      {formatINR(ocrResult.amount)}
                    </span>
                    <span className={`text-xs font-medium ${getConfidenceColor(ocrResult.confidence)}`}>
                      {getConfidenceLabel(ocrResult.confidence)} confidence ({Math.round(ocrResult.confidence * 100)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {previewUrl && (
              <div className="relative rounded-xl overflow-hidden bg-white/10 p-4">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="max-h-48 mx-auto object-contain rounded-lg"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">
                Confirm or Edit Amount (₹)
              </label>
              <input
                type="number"
                value={editedAmount}
                onChange={(e) => setEditedAmount(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 rounded-xl bg-white/80 border border-white/20 text-secondary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
              />
              <p className="text-[10px] text-text-muted mt-1">
                You can edit the amount if the extraction is incorrect
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <GlassButton variant="outline" onClick={handleClose}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" onClick={handleConfirm}>
                <CheckCircle className="w-4 h-4" />
                Confirm & Use Amount
              </GlassButton>
            </div>
          </>
        )}

        {status === "error" && (
          <div className="flex gap-3 justify-end">
            <GlassButton variant="outline" onClick={handleClose}>
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={() => {
                setStatus("idle");
                setError(null);
              }}
            >
              Try Again
            </GlassButton>
          </div>
        )}
      </div>
    </GlassModal>
  );
}
