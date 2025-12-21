import React, { useEffect, useRef, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'

type LayoutContext = { userDetails: any }

const Qr: React.FC = () => {
  const { userDetails } = useOutletContext<LayoutContext>()
  const navigate = useNavigate()

  // default to showing user's own QR on page load
  const [mode, setMode] = useState<'scan' | 'show'>('show')
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<any>(null)
  const rafRef = useRef<number | null>(null)

  // Start camera + barcode detection using the Browser BarcodeDetector API if available
  const startCameraScan = async () => {
    setScanError(null)
    if (!('mediaDevices' in navigator)) {
      setScanError('Camera not available in this browser')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Use BarcodeDetector if available (Chromium-based browsers)
      if ((window as any).BarcodeDetector) {
        try {
          const BarcodeDetector = (window as any).BarcodeDetector
          detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] })
        } catch (err) {
          detectorRef.current = null
        }
      } else {
        detectorRef.current = null
      }

  setScanning(true)
      // Poll for detection
      const poll = async () => {
        try {
          if (detectorRef.current && videoRef.current) {
            const results = await detectorRef.current.detect(videoRef.current)
            if (results && results.length > 0) {
              const raw = results[0].rawValue
              finishScan(raw)
              return
            }
          }
        } catch (err: any) {
          // ignore detection errors
          console.error('Detection error', err)
        }
        rafRef.current = requestAnimationFrame(poll)
      }

      rafRef.current = requestAnimationFrame(poll)
    } catch (err: any) {
      console.error('Camera start failed', err)
      setScanError('Failed to start camera')
    }
  }

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
      try { videoRef.current.pause() } catch {};
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Auto-start/stop camera when switching modes. When user clicks Scan, `mode` becomes 'scan'
  useEffect(() => {
    if (mode === 'scan') {
      // start scanning automatically when entering scan mode
      startCameraScan()
    } else {
      // stop camera when leaving scan mode
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const finishScan = (raw: string) => {
    stopCamera()
    // raw is expected to contain the user's email (or a URL containing it). Try to extract email.
    const emailMatch = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
    const email = emailMatch ? emailMatch[0] : raw
    // navigate to home and pass recipient as URL param
    navigate(`/?recipient=${encodeURIComponent(email)}`)
  }

  const myEmail = userDetails?.email || localStorage.getItem('user_email') || ''

  return (
    <div className="w-full p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">QR code</h2>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setMode('show')}
            className={`py-2 px-4 rounded ${mode === 'show' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Show my QR
          </button>
          <button
            onClick={() => setMode('scan')}
            className={`py-2 px-4 rounded ${mode === 'scan' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Scan someone's QR
          </button>
        </div>

        {mode === 'show' && (
          <div className="bg-white p-6 rounded shadow text-center">
            <p className="mb-3 text-sm text-gray-600">Share this QR code to receive payments.</p>
            {myEmail ? (
              <div className="inline-block bg-white p-4 rounded">
                <img
                  alt="my-qr"
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(myEmail)}&size=240x240`}
                  width={240}
                  height={240}
                />
                <div className="mt-3 text-sm text-gray-700">{myEmail}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No email available to generate QR.</div>
            )}
          </div>
        )}

        {mode === 'scan' && (
          <div className="bg-white p-6 rounded shadow">
            <p className="mb-3 text-sm text-gray-600 text-center">Point your camera at a QR code or paste the code below.</p>

            {/* Camera preview - square mode */}
            <div className="mb-4 flex justify-center">
              {scanning ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="bg-black rounded"
                    style={{ width: 320, height: 320, objectFit: 'cover' }}
                  />
                  <button onClick={() => setMode('show')} className="absolute top-2 right-2 bg-white rounded px-3 py-1">Close</button>
                </div>
              ) : (
                <div className="p-6 border rounded text-center">
                  <div className="mb-3 text-sm text-gray-500">Initializing camera — please allow camera access.</div>
                  <div className="flex justify-center">
                    <button onClick={startCameraScan} className="py-2 px-4 bg-blue-600 text-white rounded">Retry camera</button>
                  </div>
                </div>
              )}
            </div>

            {scanError && <div className="text-sm text-red-600">{scanError}</div>}

            {/* <div className="text-xs text-gray-500 mt-4 text-center">If your browser doesn't support direct camera QR decoding, use the paste input above.</div> */}
          </div>
        )}
      </div>
    </div>
  )
}

export default Qr
