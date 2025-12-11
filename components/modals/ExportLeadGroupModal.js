'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Contact, Download, AlertCircle, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '../../utils/formatDate';

export default function ExportLeadGroupModal({ group, onClose }) {
    const [selectedFormat, setSelectedFormat] = useState(null); // 'csv' or 'vcf'
    const [exportStatus, setExportStatus] = useState(null); // 'pending', 'processing', 'completed', 'error'
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [fileCreatedAt, setFileCreatedAt] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [isOutdated, setIsOutdated] = useState(false);

    // Check export status when format is selected
    useEffect(() => {
        if (selectedFormat && group) {
            checkExportStatus();
        }
    }, [selectedFormat, group]);

    const checkExportStatus = async () => {
        if (!group || !selectedFormat) return;

        setIsChecking(true);
        try {
            const urlField = selectedFormat === 'csv' ? 'csv_url' : 'vcf_url';
            const createdAtField = selectedFormat === 'csv' ? 'csv_created_at' : 'vcf_created_at';

            const fileUrl = group[urlField];
            const fileCreated = group[createdAtField];
            const groupUpdated = group.updated_at;

            // Check if file exists and is up to date
            if (fileUrl && fileCreated) {
                const fileDate = new Date(fileCreated);
                const groupDate = new Date(groupUpdated);

                if (fileDate >= groupDate) {
                    // File is up to date
                    setDownloadUrl(fileUrl);
                    setFileCreatedAt(fileCreated);
                    setExportStatus('completed');
                    setIsOutdated(false);
                } else {
                    // File is outdated
                    setIsOutdated(true);
                    setExportStatus('pending');
                }
            } else {
                // No file exists
                setExportStatus('pending');
                setIsOutdated(false);
            }
        } catch (error) {
            console.error('Error checking export status:', error);
            toast.error('Durum kontrol edilirken hata oluştu');
        } finally {
            setIsChecking(false);
        }
    };

    const handleExport = async () => {
        if (!group || !selectedFormat) return;

        setIsUpdating(true);
        setExportStatus('processing');

        try {
            const response = await fetch(`/api/groups/${group.id}/export`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    format: selectedFormat,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Export başlatılamadı');
            }

            if (data.status === 'completed' && data.downloadUrl) {
                // File is ready
                setDownloadUrl(data.downloadUrl);
                setFileCreatedAt(data.createdAt);
                setExportStatus('completed');
                setIsOutdated(false);
                toast.success('Dosya hazır!');
            } else if (data.status === 'processing') {
                // File is being generated
                setExportStatus('processing');
                toast.info('Dosya hazırlanıyor...');

                // Poll for completion
                pollExportStatus();
            } else {
                throw new Error('Beklenmeyen durum');
            }
        } catch (error) {
            console.error('Error exporting:', error);
            setExportStatus('error');
            toast.error(error.message || 'Export başlatılırken hata oluştu');
        } finally {
            setIsUpdating(false);
        }
    };

    const pollExportStatus = async () => {
        const maxAttempts = 60; // 5 minutes max (5 second intervals)
        let attempts = 0;

        const poll = async () => {
            if (attempts >= maxAttempts) {
                setExportStatus('error');
                toast.error('Dosya hazırlanırken zaman aşımı oluştu');
                return;
            }

            try {
                const response = await fetch(`/api/groups/${group.id}/export?format=${selectedFormat}`);
                const data = await response.json();

                if (data.status === 'completed' && data.downloadUrl) {
                    setDownloadUrl(data.downloadUrl);
                    setFileCreatedAt(data.createdAt);
                    setExportStatus('completed');
                    setIsOutdated(false);
                    toast.success('Dosya hazır!');
                } else if (data.status === 'processing') {
                    attempts++;
                    setTimeout(poll, 5000); // Check every 5 seconds
                } else if (data.status === 'error') {
                    setExportStatus('error');
                    toast.error('Dosya oluşturulurken hata oluştu');
                } else {
                    attempts++;
                    setTimeout(poll, 5000);
                }
            } catch (error) {
                console.error('Error polling status:', error);
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(poll, 5000);
                } else {
                    setExportStatus('error');
                    toast.error('Durum kontrol edilirken hata oluştu');
                }
            }
        };

        poll();
    };

    const handleDownload = async () => {
        if (downloadUrl && group) {
            try {
                // Fetch the file
                const response = await fetch(downloadUrl);
                const blob = await response.blob();

                // Create filename with group name and date
                const date = new Date();
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const dateStr = `${day}-${month}-${year}`;

                // Sanitize group name for filename
                const sanitizedName = group.name
                    .replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s-]/g, '')
                    .replace(/\s+/g, '_')
                    .replace(/_+/g, '_')
                    .trim();

                const fileExtension = selectedFormat === 'csv' ? 'csv' : 'vcf';
                const filename = `${sanitizedName}_${dateStr}.${fileExtension}`;

                // Create download link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } catch (error) {
                console.error('Download error:', error);
                // Fallback to opening in new tab
                window.open(downloadUrl, '_blank');
            }
        }
    };

    const handleBack = () => {
        setSelectedFormat(null);
        setExportStatus(null);
        setDownloadUrl(null);
        setFileCreatedAt(null);
        setIsOutdated(false);
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-800">
                        {selectedFormat
                            ? `${group?.name} Listesini İndir`
                            : `${group?.name} Listesini İndir`}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {!selectedFormat ? (
                    // Format Selection
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 mb-4">
                            İndirmek istediğiniz dosya formatını seçiniz:
                        </p>

                        <button
                            onClick={() => setSelectedFormat('csv')}
                            className="w-full p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <FileText size={24} className="text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-slate-800 mb-1">CSV Formatı</h4>
                                    <p className="text-sm text-slate-600">
                                        Excel ve diğer tablo programlarında açılabilen CSV dosyası
                                    </p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setSelectedFormat('vcf')}
                            className="w-full p-6 border-2 border-slate-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <Contact size={24} className="text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-slate-800 mb-1">VCF Formatı</h4>
                                    <p className="text-sm text-slate-600">
                                        iOS ve Android cihazlara aktarılabilen vCard dosyası
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                ) : (
                    // Export Status View
                    <div className="space-y-6">
                        {isChecking ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="animate-spin text-blue-500" size={32} />
                                <span className="ml-3 text-slate-600">Kontrol ediliyor...</span>
                            </div>
                        ) : exportStatus === 'completed' && downloadUrl ? (
                            // File Ready
                            <div className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="text-green-600 mt-0.5" size={20} />
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-green-800 mb-1">
                                                Dosya Hazır
                                            </h4>
                                            {fileCreatedAt && (
                                                <p className="text-sm text-green-700">
                                                    Oluşturulma: {formatDate(fileCreatedAt)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleDownload}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                                >
                                    <Download size={18} />
                                    <span>İndir ({selectedFormat.toUpperCase()})</span>
                                </button>
                            </div>
                        ) : exportStatus === 'processing' ? (
                            // Processing
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <Loader2 className="animate-spin text-blue-600 mt-0.5" size={20} />
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-blue-800 mb-1">
                                                Dosya Hazırlanıyor...
                                            </h4>
                                            <p className="text-sm text-blue-700">
                                                Lütfen bekleyin, dosyanız hazırlandığında otomatik olarak indirilebilir
                                                hale gelecektir.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : exportStatus === 'error' ? (
                            // Error
                            <div className="space-y-4">
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="text-red-600 mt-0.5" size={20} />
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-red-800 mb-1">
                                                Hata Oluştu
                                            </h4>
                                            <p className="text-sm text-red-700">
                                                Dosya oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleExport}
                                    disabled={isUpdating}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshCw size={18} />
                                    <span>Tekrar Dene</span>
                                </button>
                            </div>
                        ) : (
                            // Pending or Outdated
                            <div className="space-y-4">
                                {isOutdated && (
                                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="text-orange-600 mt-0.5" size={20} />
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-orange-800 mb-1">
                                                    Dosya Güncel Değil
                                                </h4>
                                                <p className="text-sm text-orange-700">
                                                    Liste güncellenmiş olabilir, mevcut dosya eski olabilir. Yeni bir
                                                    dosya oluşturmanız önerilir.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleExport}
                                    disabled={isUpdating}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            <span>Hazırlanıyor...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download size={18} />
                                            <span>
                                                {isOutdated ? 'Yeni Dosya Oluştur' : 'Dosya Oluştur'}
                                            </span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Geri
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
