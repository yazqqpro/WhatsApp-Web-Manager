import { useEffect, useState } from "react";
import { socketManager } from "@/lib/socket";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { nanoid } from "nanoid";

export default function QRSetup() {
  const [qrCode, setQrCode] = useState<string>("");
  const [status, setStatus] = useState("Generating QR Code...");
  const [sessionId] = useState(() => nanoid());
  const [, setLocation] = useLocation();

  useEffect(() => {
    socketManager.connect();

    // Listen for QR code
    socketManager.on('qr', (data: any) => {
      if (data.sessionId === sessionId) {
        setQrCode(data.qr);
        setStatus("Scan the QR code with WhatsApp");
      }
    });

    // Listen for successful connection
    socketManager.on('session_ready', (data: any) => {
      if (data.sessionId === sessionId) {
        setStatus("Connected! Redirecting to dashboard...");
        setTimeout(() => {
          setLocation('/');
        }, 2000);
      }
    });

    // Listen for errors
    socketManager.on('session_error', (data: any) => {
      if (data.sessionId === sessionId) {
        setStatus(`Error: ${data.error}`);
      }
    });

    // Initialize session
    socketManager.emit('initialize_session', { sessionId });

    return () => {
      socketManager.off('qr');
      socketManager.off('session_ready');
      socketManager.off('session_error');
    };
  }, [sessionId, setLocation]);

  const refreshQR = () => {
    setQrCode("");
    setStatus("Generating new QR Code...");
    socketManager.emit('initialize_session', { sessionId });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      <Card className="max-w-md w-full mx-4 shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">WhatsApp Web Manager</h1>
            <p className="text-gray-600">Scan the QR code with WhatsApp to get started</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center h-64 bg-white rounded-lg border-2 border-dashed border-gray-300">
              {qrCode ? (
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`}
                      alt="WhatsApp QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-gray-500">{status}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-3 text-sm text-gray-600 mb-6">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Open WhatsApp on your phone</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h5m0 0v5m0 0h5" />
              </svg>
              <span>Tap Menu → Linked Devices → Link a Device</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Point your phone at this screen to capture the code</span>
            </div>
          </div>

          {qrCode && (
            <Button onClick={refreshQR} variant="outline" className="w-full">
              Refresh QR Code
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
