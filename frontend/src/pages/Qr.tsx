import React, { useEffect, useRef, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'

type LayoutContext = { userDetails: any }

const Qr: React.FC = () => {
  const { userDetails } = useOutletContext<LayoutContext>()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'scan' | 'show'>('show')
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<any>(null)
  const rafRef = useRef<number | null>(null)

  const stopCamera = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }

  const startCameraScan = async () => {
    setScanError(null)
    
    // 1. Check for BarcodeDetector Support (Chrome/Edge only)
    if (!('BarcodeDetector' in window)) {
      setScanError('Native scanning not supported on this browser. Use Chrome or Edge for the best experience.')
      // Note: We continue so the camera at least opens, even if detection won't work natively
    } else {
      const BarcodeDetector = (window as any).BarcodeDetector
      detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] })
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 640 }
        } 
      })
      
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // 2. ONLY start detection once the video is actually playing
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setScanning(true)
            startDetectionLoop()
          }).catch(err => {
            console.error("Playback failed", err)
            setScanError("Click 'Retry' to start camera.")
          })
        }
      }
    } catch (err: any) {
      console.error('Camera start failed', err)
      setScanError('Camera access denied or unavailable.')
    }
  }

  const startDetectionLoop = () => {
    const poll = async () => {
      if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2) {
        rafRef.current = requestAnimationFrame(poll)
        return
      }

      try {
        const results = await detectorRef.current.detect(videoRef.current)
        if (results && results.length > 0) {
          const raw = results[0].rawValue
          finishScan(raw)
          return // Exit loop on success
        }
      } catch (err) {
        console.error('Detection error', err)
      }
      
      rafRef.current = requestAnimationFrame(poll)
    }
    rafRef.current = requestAnimationFrame(poll)
  }

  const finishScan = (raw: string) => {
    stopCamera()
    const emailMatch = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
    const email = emailMatch ? emailMatch[0] : raw
    navigate(`/?recipient=${encodeURIComponent(email)}`)
  }

  useEffect(() => {
    if (mode === 'scan') {
      startCameraScan()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [mode])

  const myEmail = userDetails?.email || localStorage.getItem('user_email') || ''

  return (
    <div className="w-full p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">QR code</h2>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setMode('show')}
            className={`py-2 px-4 rounded transition-colors ${mode === 'show' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Show my QR
          </button>
          <button
            onClick={() => setMode('scan')}
            className={`py-2 px-4 rounded transition-colors ${mode === 'scan' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Scan someone's QR
          </button>
        </div>

        {mode === 'show' && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="mb-6 text-sm text-gray-500">Share this QR code to receive payments.</p>
            {myEmail ? (
              <div className="inline-block p-4 border-2 border-gray-50 rounded-2xl bg-white">
                <img
                  alt="my-qr"
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(myEmail)}&size=240x240`}
                  className="mx-auto"
                />
                <div className="mt-4 font-medium text-gray-800">{myEmail}</div>
              </div>
            ) : (
              <div className="py-10 text-gray-400">No account email found.</div>
            )}
          </div>
        )}

        {mode === 'scan' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="mb-4 text-sm text-center text-gray-600">Align the QR code within the frame to scan.</p>

            <div className="relative flex justify-center items-center overflow-hidden rounded-lg bg-black aspect-square max-w-[400px] mx-auto">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />
              
              {/* Overlay for Scanning Effect */}
              {scanning && (
                <div className="absolute inset-0 border-2 border-blue-500 opacity-30 animate-pulse pointer-events-none">
                   <div className="absolute top-1/2 left-0 w-full h-[2px] bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan"></div>
                </div>
              )}

              {!scanning && !scanError && (
                <div className="absolute text-white text-sm animate-pulse">Initializing camera...</div>
              )}
            </div>

            {scanError && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg text-center">
                {scanError}
                <button onClick={startCameraScan} className="block w-full mt-2 font-bold underline">Try Again</button>
              </div>
            )}
            
            <button 
              onClick={() => setMode('show')}
              className="mt-6 w-full py-3 text-gray-500 text-sm font-medium border rounded-lg"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 10%; }
          100% { top: 90%; }
        }
        .animate-scan {
          position: absolute;
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default Qr