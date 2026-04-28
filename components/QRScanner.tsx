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
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
    const [activeCameraId, setActiveCameraId] = useState<string | null>(null);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerId = 'reader';

    useEffect(() => {
        let mounted = true;

        async function startScanner() {
            if (!isScanning) return;

            try {
                setIsInitializing(true);
                setError(null);

                // Ensure clean state
                if (scannerRef.current) {
                    try {
                        const state = scannerRef.current.getState();
                        if (state === 2 || state === 3) {
                            await scannerRef.current.stop();
                        }
                    } catch (e) { }
                    scannerRef.current = null;
                }

                // Get cameras if not already fetched
                if (cameras.length === 0) {
                    try {
                        const devices = await Html5Qrcode.getCameras();
                        if (devices && devices.length > 0) {
                            setCameras(devices.map(d => ({ id: d.id, label: d.label })));
                            if (!activeCameraId) setActiveCameraId(devices[0].id);
                        }
                    } catch (e) {
                        console.error('Failed to get cameras', e);
                    }
                }

                const html5QrCode = new Html5Qrcode(containerId);
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 30,
                    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        const size = Math.floor(minEdge * 0.75);
                        return { width: size, height: size };
                    },
                    aspectRatio: 1.0,
                };

                const cameraConfig = activeCameraId ? { deviceId: { exact: activeCameraId } } : { facingMode: 'environment' };

                await html5QrCode.start(
                    cameraConfig,
                    config,
                    async (decodedText) => {
                        if (!mounted) return;

                        // Stop scanning safely
                        if (scannerRef.current) {
                            try {
                                const state = scannerRef.current.getState();
                                if (state === 2) await scannerRef.current.stop();
                            } catch (e) { }
                        }

                        setIsScanning(false);
                        setIsProcessing(true);

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
                                message: 'Process failed. Please try scanning again.',
                            });
                        } finally {
                            setIsProcessing(false);
                        }
                    },
                    () => { }
                );

                if (mounted) setIsInitializing(false);
            } catch (err: any) {
                console.error('Scanner start error:', err);
                if (mounted) {
                    setError('Camera connection failed. Please check permissions.');
                    setIsInitializing(false);
                }
            }
        }

        const timer = setTimeout(startScanner, 400);

        return () => {
            mounted = false;
            clearTimeout(timer);
            if (scannerRef.current) {
                try {
                    const state = scannerRef.current.getState();
                    if (state === 2) scannerRef.current.stop().catch(() => { });
                } catch (e) { }
                scannerRef.current = null;
            }
        };
    }, [isScanning, activeCameraId]);

    const switchCamera = () => {
        if (cameras.length < 2) return;
        const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
        const nextIndex = (currentIndex + 1) % cameras.length;
        setActiveCameraId(cameras[nextIndex].id);
    };

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
                            <Camera className={`h-6 w-6 md:h-8 md:w-8 text-blue-600 dark:text-blue-400 ${isInitializing ? 'animate-spin' : 'animate-pulse'}`} />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {isInitializing ? 'WAKING UP LENS' : <>SCAN <span className="text-blue-600 dark:text-blue-400">QR CODE</span></>}
                        </h2>
                        <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 font-bold mt-2 uppercase tracking-widest px-4">
                            {error ? 'LENS ERROR DETECTED' : 'POSITION THE CODE WITHIN THE SCAN BOX'}
                        </p>
                    </div>

                    <div className="relative group">
                        <div className="overflow-hidden rounded-3xl border-2 border-dashed border-slate-300 dark:border-white/10 mb-8 bg-slate-100 dark:bg-white/5 min-h-[300px] relative">
                            <div
                                id={containerId}
                                className="w-full h-full"
                            ></div>

                            {isInitializing && !error && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-500 bg-slate-50 dark:bg-[#0d0d0d] z-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Adjusting Focus...</p>
                                </div>
                            )}

                            {error && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-slate-100 dark:bg-[#0d0d0d] z-10">
                                    <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                                    <p className="text-sm font-bold text-red-600/90 leading-relaxed">{error}</p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest"
                                    >
                                        RETRY CAMERA
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Professional Scanner Frame */}
                        {!isInitializing && !error && (
                            <div className="absolute inset-0 pointer-events-none z-10 p-12">
                                <div className="relative w-full h-full border-2 border-blue-500/20 rounded-2xl">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                    
                                    {/* Scanning Bar */}
                                    <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_10px_rgba(59,130,246,1)] animate-scan-line top-1/2"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em]">
                            {!error && (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                    Awaiting QR Synchrony...
                                </>
                            )}
                        </div>

                        {cameras.length > 1 && (
                            <button
                                onClick={switchCamera}
                                className="px-4 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-slate-300 dark:hover:bg-white/20 transition-all flex items-center gap-2"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Switch Lens
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isProcessing && (
                <AnimatedWrapper tilt>
                    <div className="glass-vip-polished rounded-[2.5rem] md:rounded-[3.5rem] p-12 text-center border-beam overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-10 shadow-2xl relative">
                            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                            <div className="absolute inset-0 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin-slow"></div>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">VERIFYING...</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Validating Clinical Record</p>
                    </div>
                </AnimatedWrapper>
            )}

            {!isScanning && !isProcessing && (
                <AnimatedWrapper tilt>
                    <div className={`glass-vip-polished rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 text-center border-beam overflow-hidden ${scanResult?.success ? 'border-emerald-500/50' : 'border-red-500/50'}`}>
                        <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-8 md:mb-10 shadow-2xl ${scanResult?.success ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                            {scanResult?.success ? (
                                <CheckCircle2 className="h-10 w-10 md:h-12 md:w-12 text-emerald-500" />
                            ) : (
                                <XCircle className="h-10 w-10 md:h-12 md:w-12 text-red-500" />
                            )}
                        </div>

                        <h2 className={`text-3xl md:text-4xl font-black mb-4 md:mb-6 tracking-tighter ${scanResult?.success ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                            {scanResult?.success ? 'Identity Verified' : 'Check-In Access Denied'}
                        </h2>

                        <div className="space-y-4 mb-10 md:mb-12">
                            <p className={`text-base md:text-lg font-bold ${scanResult?.success ? 'text-slate-600 dark:text-slate-400' : 'text-red-500/90'}`}>
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
                @keyframes scan-line {
                    0%, 100% { transform: translateY(-100px); opacity: 0; }
                    50% { transform: translateY(100px); opacity: 1; }
                }
                .animate-scan-line {
                    animation: scan-line 2s infinite ease-in-out;
                }
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
            `}</style>
        </div>
    );
}
