'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { qrCheckIn } from '@/lib/actions/appointment';
import { CheckCircle2, XCircle, Camera, Loader2, RotateCcw } from 'lucide-react';
import AnimatedWrapper from '@/components/layout/AnimatedWrapper';

export default function QRScanner() {
    const [scanResult, setScanResult] = useState<{
        success: boolean;
        message: string;
        data?: { patientName: string; appointmentTime: string };
    } | null>(null);
    const [isScanning, setIsScanning] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerId = 'reader';

    useEffect(() => {
        let mounted = true;

        async function startScanner() {
            if (!isScanning) return;

            try {
                setIsInitializing(true);
                setError(null);

                // Ensure clean state - with safer check
                if (scannerRef.current) {
                    try {
                        const state = scannerRef.current.getState();
                        if (state === 2 || state === 3) { // 2 = SCANNING, 3 = PAUSED
                            await scannerRef.current.stop();
                        }
                    } catch (e) {
                        // ignore error if it's already stopped
                    }
                    scannerRef.current = null;
                }

                const html5QrCode = new Html5Qrcode(containerId);
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 20,
                    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        const size = Math.floor(minEdge * 0.7);
                        return { width: size, height: size };
                    },
                    aspectRatio: 1.0,
                };

                await html5QrCode.start(
                    { facingMode: 'environment' },
                    config,
                    async (decodedText) => {
                        if (!mounted) return;

                        // Stop scanning safely
                        if (scannerRef.current) {
                            try {
                                const state = scannerRef.current.getState();
                                if (state === 2) { // 2 = SCANNING
                                    await scannerRef.current.stop();
                                }
                            } catch (e) {
                                console.error('Stop failed', e);
                            }
                        }

                        setIsScanning(false);
                        setIsInitializing(false);

                        try {
                            const result = await qrCheckIn(decodedText);
                            if (result.success) {
                                setScanResult({
                                    success: true,
                                    message: 'Checked-In Successfully',
                                    data: result.data as any,
                                });
                            } else {
                                setScanResult({
                                    success: false,
                                    message: result.error || 'Invalid QR Code or Appointment Not Found.',
                                });
                            }
                        } catch (err) {
                            setScanResult({
                                success: false,
                                message: 'Invalid QR Code or Appointment Not Found.',
                            });
                        }
                    },
                    (errorMessage) => {
                        // ignore video frame errors
                    }
                );

                if (mounted) setIsInitializing(false);
            } catch (err: any) {
                console.error('Scanner start error:', err);
                if (mounted) {
                    setError(err?.message || 'Camera access failed. Please ensure permissions are granted.');
                    setIsInitializing(false);
                }
            }
        }

        const timer = setTimeout(startScanner, 500);

        return () => {
            mounted = false;
            clearTimeout(timer);
            if (scannerRef.current) {
                try {
                    const state = scannerRef.current.getState();
                    if (state === 2) { // 2 = SCANNING
                        scannerRef.current.stop().catch(() => { });
                    }
                } catch (e) {
                    // console.warn('Cleanup stop error', e);
                }
                scannerRef.current = null;
            }
        };
    }, [isScanning]);

    const resetScanner = () => {
        setScanResult(null);
        setIsScanning(true);
        setError(null);
    };

    return (
        <div className="w-full max-w-xl mx-auto px-4">
            <div style={{ display: isScanning ? 'block' : 'none' }}>
                <div className="glass-vip-polished rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 border-beam overflow-hidden text-center relative">
                    <div className="mb-6 md:mb-8">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl">
                            <Camera className={`h-6 w-6 md:h-8 md:w-8 text-blue-500 ${isInitializing ? 'animate-spin' : 'animate-pulse'}`} />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                            {isInitializing ? 'Initializing...' : <>Align <span className="text-blue-500">QR Code</span></>}
                        </h2>
                        <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold mt-2 uppercase tracking-widest px-4">
                            {error ? 'Configuration error detected' : 'Position the code within the scanner frame'}
                        </p>
                    </div>

                    <div className="relative group">
                        {/* Dedicate this container SOLELY to the library to avoid React 'removeChild' conflicts */}
                        <div className="overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 mb-8 bg-black/5 dark:bg-white/5 min-h-[300px] relative">
                            <div
                                id={containerId}
                                className="w-full h-full"
                            ></div>

                            {/* Overlay React UI on top of the scanner container, instead of inside it */}
                            {isInitializing && !error && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-400 bg-slate-50 dark:bg-[#0d0d0d] z-10">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Waking up lens...</p>
                                </div>
                            )}

                            {error && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-slate-50 dark:bg-[#0d0d0d] z-10">
                                    <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                                    <p className="text-sm font-bold text-red-500/80 leading-relaxed">{error}</p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest"
                                    >
                                        Reload Interface
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Viewfinder Corners */}
                        {!isInitializing && !error && (
                            <div className="absolute inset-x-0 top-0 bottom-8 pointer-events-none">
                                <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl opacity-50"></div>
                                <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl opacity-50"></div>
                                <div className="absolute bottom-12 left-4 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl opacity-50"></div>
                                <div className="absolute bottom-12 right-4 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl opacity-50"></div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pb-2">
                        {!error && (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Awaiting Optical Signature...
                            </>
                        )}
                    </div>
                </div>
            </div>

            {!isScanning && (
                <AnimatedWrapper tilt>
                    <div className={`glass-vip-polished rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 text-center border-beam overflow-hidden ${scanResult?.success ? 'border-emerald-500/50' : 'border-red-500/50'}`}>
                        <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-8 md:mb-10 shadow-2xl ${scanResult?.success ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                            {scanResult?.success ? (
                                <CheckCircle2 className="h-10 w-10 md:h-12 md:w-12 text-emerald-500" />
                            ) : (
                                <XCircle className="h-10 w-10 md:h-12 md:w-12 text-red-500" />
                            )}
                        </div>

                        <h2 className={`text-3xl md:text-4xl font-black mb-4 md:mb-6 tracking-tighter ${scanResult?.success ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
                            {scanResult?.success ? 'Verified.' : 'Access Denied.'}
                        </h2>

                        <div className="space-y-4 mb-10 md:mb-12">
                            <p className="text-base md:text-lg font-bold text-slate-600 dark:text-slate-300">
                                {scanResult?.message}
                            </p>

                            {scanResult?.success && scanResult.data && (
                                <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-white/10 text-left">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="overflow-hidden">
                                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient Name</p>
                                            <p className="text-xs md:text-sm font-black text-slate-900 dark:text-white truncate">{scanResult.data.patientName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Schedule Time</p>
                                            <p className="text-xs md:text-sm font-black text-slate-900 dark:text-white">{scanResult.data.appointmentTime}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 md:gap-4">
                            <button
                                onClick={resetScanner}
                                className="w-full py-5 md:py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl md:rounded-[1.5rem] hover:opacity-90 transition-all uppercase tracking-widest text-[10px] md:text-xs shadow-xl active:scale-95 flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Scan Another
                            </button>

                            <a
                                href="/checkin"
                                className="text-[10px] md:text-[11px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all uppercase tracking-widest py-2"
                            >
                                Back to Portal
                            </a>
                        </div>
                    </div>
                </AnimatedWrapper>
            )}

            <style jsx global>{`
                #reader video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    border-radius: 1.5rem;
                }
                #reader {
                    border: none !important;
                }
                #reader__scan_region {
                    background: transparent !important;
                }
            `}</style>
        </div>
    );
}
