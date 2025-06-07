import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { socketManager } from "@/lib/socket";
import SessionCard from "@/components/session-card";
import MessageList from "@/components/message-list";
import SendMessageForm from "@/components/send-message-form";
import ApiDocs from "@/components/api-docs";
import AddSessionModal from "@/components/add-session-modal";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("sessions");
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  const { data: sessions, refetch: refetchSessions } = useQuery({
    queryKey: ['/api/sessions'],
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    socketManager.connect();

    // Listen for session updates
    socketManager.on('session_status', (data: any) => {
      toast({
        title: "Session Status Update",
        description: `Session ${data.sessionId} is now ${data.status}`,
      });
      refetchSessions();
    });

    socketManager.on('session_ready', (data: any) => {
      toast({
        title: "Session Connected",
        description: `WhatsApp session for ${data.info.pushname} is ready`,
      });
      refetchSessions();
    });

    socketManager.on('new_message', (data: any) => {
      toast({
        title: "New Message",
        description: `Message from ${data.from}: ${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''}`,
      });
    });

    return () => {
      socketManager.off('session_status');
      socketManager.off('session_ready');
      socketManager.off('new_message');
    };
  }, [toast, refetchSessions]);

  const sessionsList = sessions?.sessions || [];
  const connectedSessions = sessionsList.filter((s: any) => s.status === 'connected');

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-surface shadow-lg border-r border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-foreground">WA Manager</h1>
              <p className="text-sm text-muted-foreground">Multi-Session</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
            <TabsList className="grid w-full grid-cols-1 gap-2 h-auto bg-transparent">
              <TabsTrigger value="sessions" className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-white">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Sessions
                <span className="ml-auto bg-white/20 text-xs px-2 py-1 rounded-full">
                  {sessionsList.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-white">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Messages
                <span className="ml-auto bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                  {stats?.unreadMessages || 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="send" className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-white">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send Message
              </TabsTrigger>
              <TabsTrigger value="api" className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-white">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                API Docs
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-secondary rounded-full"></div>
              <span className="ml-2 text-sm text-muted-foreground">System Online</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last sync: {stats?.lastSync ? new Date(stats.lastSync).toLocaleTimeString() : 'Never'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-surface border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {activeTab === 'sessions' && 'WhatsApp Sessions'}
                {activeTab === 'messages' && 'Incoming Messages'}
                {activeTab === 'send' && 'Send Message'}
                {activeTab === 'api' && 'API Documentation'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'sessions' && 'Manage your connected WhatsApp accounts'}
                {activeTab === 'messages' && 'View messages from all connected sessions'}
                {activeTab === 'send' && 'Send WhatsApp messages via API'}
                {activeTab === 'api' && 'REST API endpoints and documentation'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {activeTab === 'sessions' && (
                <Button onClick={() => setShowAddModal(true)} className="bg-primary text-white hover:bg-primary/90">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Session
                </Button>
              )}
              <div className="relative">
                <Button variant="ghost" size="sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h9v-15h-9v15zm6-11h-4v1h4v-1zm0 2h-4v1h4v-1zm0 2h-4v1h4v-1z" />
                  </svg>
                  {stats?.unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full"></span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="sessions" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                {sessionsList.map((session: any) => (
                  <SessionCard key={session.id} session={session} />
                ))}
                
                {/* Add New Session Card */}
                <div 
                  className="bg-surface rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-6 flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                  onClick={() => setShowAddModal(true)}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Add New Session</h3>
                    <p className="text-sm text-muted-foreground">Connect another WhatsApp account</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="messages" className="mt-0">
              <MessageList />
            </TabsContent>

            <TabsContent value="send" className="mt-0">
              <SendMessageForm sessions={connectedSessions} />
            </TabsContent>

            <TabsContent value="api" className="mt-0">
              <ApiDocs />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <AddSessionModal open={showAddModal} onOpenChange={setShowAddModal} />
    </div>
  );
}
