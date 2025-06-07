import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function MessageList() {
  const [selectedSession, setSelectedSession] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: sessions } = useQuery({
    queryKey: ['/api/sessions'],
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ['/api/messages', selectedSession === 'all' ? undefined : selectedSession],
  });

  const markAsReadMutation = useMutation({
    mutationFn: (messageId: number) => apiRequest('PUT', `/api/messages/${messageId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const messagesList = messages?.messages || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Incoming Messages</h3>
          <div className="flex items-center space-x-3">
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessions?.sessions?.map((session: any) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.name} ({session.phone})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
              Filter
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {messagesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <svg className="w-16 h-16 text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Messages</h3>
            <p className="text-muted-foreground">No incoming messages found for the selected session.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {messagesList.map((message: any) => (
              <div key={message.id} className="p-6 hover:bg-muted/50">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-foreground">{message.from}</h4>
                        <p className="text-sm text-muted-foreground">
                          from <span className="font-medium">{message.sessionId}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-muted-foreground">
                          {formatTime(message.timestamp)}
                        </span>
                        {!message.isRead && !message.isOutgoing && (
                          <div className="flex items-center mt-1">
                            <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">New</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-foreground mb-2">{message.message}</p>
                    {message.mediaPath && (
                      <div className="mb-2">
                        <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                          📎 Media attachment
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-4 text-sm">
                      {!message.isRead && !message.isOutgoing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsReadMutation.mutate(message.id)}
                          disabled={markAsReadMutation.isPending}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Mark as Read
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Reply
                      </Button>
                      <Button variant="ghost" size="sm">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        Forward
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
