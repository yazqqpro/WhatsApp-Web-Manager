import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { socketManager } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";

interface AddSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddSessionModal({ open, onOpenChange }: AddSessionModalProps) {
  const [qrCode, setQrCode] = useState<string>("");
  const [status, setStatus] = useState("Waiting for session name...");
  const [sessionId, setSessionId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      sessionName: "",
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: (data: { id: string; name: string }) => 
      apiRequest('POST', '/api/sessions', data),
    onSuccess: () => {
      setStatus("Session created! Generating QR code...");
      // Initialize session via socket
      socketManager.emit('initialize_session', { sessionId });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create session",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!open) {
      setQrCode("");
      setStatus("Waiting for session name...");
      setSessionId("");
      form.reset();
      return;
    }

    const newSessionId = nanoid();
    setSessionId(newSessionId);

    socketManager.connect();

    // Listen for QR code
    const handleQr = (data: any) => {
      if (data.sessionId === newSessionId) {
        setQrCode(data.qr);
        setStatus("Scan the QR code with WhatsApp");
      }
    };

    // Listen for successful connection
    const handleSessionReady = (data: any) => {
      if (data.sessionId === newSessionId) {
        setStatus("Connected! Session ready.");
        toast({
          title: "Session Connected",
          description: `WhatsApp session for ${data.info.pushname} is ready`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      }
    };

    // Listen for errors
    const handleSessionError = (data: any) => {
      if (data.sessionId === newSessionId) {
        setStatus(`Error: ${data.error}`);
        toast({
          title: "Session Error",
          description: data.error,
          variant: "destructive",
        });
      }
    };

    socketManager.on('qr', handleQr);
    socketManager.on('session_ready', handleSessionReady);
    socketManager.on('session_error', handleSessionError);

    return () => {
      socketManager.off('qr', handleQr);
      socketManager.off('session_ready', handleSessionReady);
      socketManager.off('session_error', handleSessionError);
    };
  }, [open, sessionId, onOpenChange, toast, queryClient, form]);

  const onSubmit = (data: any) => {
    if (!data.sessionName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a session name",
        variant: "destructive",
      });
      return;
    }

    createSessionMutation.mutate({
      id: sessionId,
      name: data.sessionName.trim(),
    });
  };

  const refreshQR = () => {
    setQrCode("");
    setStatus("Generating new QR Code...");
    socketManager.emit('initialize_session', { sessionId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New WhatsApp Session</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!createSessionMutation.isSuccess && (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="sessionName">Session Name</Label>
                <Input
                  id="sessionName"
                  placeholder="e.g., Business Account"
                  {...form.register('sessionName')}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Give this session a recognizable name
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : null}
                Create Session
              </Button>
            </form>
          )}

          {createSessionMutation.isSuccess && (
            <>
              <div className="text-center mb-6">
                <p className="text-muted-foreground mb-4">
                  Scan the QR code with WhatsApp to add this session
                </p>
                
                <div className="bg-muted rounded-xl p-6">
                  <div className="flex items-center justify-center h-48 bg-background rounded-lg border-2 border-dashed border-border">
                    {qrCode ? (
                      <div className="text-center">
                        <div className="bg-white p-4 rounded-lg inline-block">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCode)}`}
                            alt="WhatsApp QR Code"
                            className="w-32 h-32"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-muted-foreground">{status}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={refreshQR}
                  disabled={!qrCode}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh QR
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
