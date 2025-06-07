import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ApiDocs() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const baseUrl = window.location.origin;

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">REST API Documentation</h3>
            <p className="text-sm text-muted-foreground">Integrate WhatsApp messaging into your applications</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="secondary">v1.0.0</Badge>
            <Button size="sm" onClick={() => window.open('/api/docs', '_blank')}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Full Docs
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Base URL */}
        <div className="bg-muted rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Base URL</h4>
              <code className="text-sm font-mono text-primary bg-background px-2 py-1 rounded mt-1 inline-block">
                {baseUrl}/api
              </code>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => copyToClipboard(`${baseUrl}/api`)}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy
            </Button>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="space-y-6">
          {/* Send Message Endpoint */}
          <div className="border border-border rounded-lg">
            <div className="p-4 bg-muted border-b border-border">
              <h4 className="flex items-center font-medium text-foreground">
                <Badge className="bg-secondary text-white mr-3">POST</Badge>
                /send-message
              </h4>
              <p className="text-sm text-muted-foreground mt-1">Send a WhatsApp message</p>
            </div>
            <div className="p-4">
              <h5 className="font-medium text-foreground mb-2">Request Body</h5>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                <code>{`{
  "sessionId": "string",
  "to": "string", 
  "message": "string",
  "media": "string (optional)"
}`}</code>
              </pre>
              <h5 className="font-medium text-foreground mb-2 mt-4">Response</h5>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                <code>{`{
  "success": true,
  "messageId": "string",
  "timestamp": "string"
}`}</code>
              </pre>
            </div>
          </div>

          {/* Get Sessions Endpoint */}
          <div className="border border-border rounded-lg">
            <div className="p-4 bg-muted border-b border-border">
              <h4 className="flex items-center font-medium text-foreground">
                <Badge className="bg-primary text-white mr-3">GET</Badge>
                /sessions
              </h4>
              <p className="text-sm text-muted-foreground mt-1">Get all active WhatsApp sessions</p>
            </div>
            <div className="p-4">
              <h5 className="font-medium text-foreground mb-2">Response</h5>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                <code>{`{
  "sessions": [
    {
      "id": "string",
      "phone": "string",
      "name": "string", 
      "status": "connected|disconnected",
      "lastActivity": "string"
    }
  ]
}`}</code>
              </pre>
            </div>
          </div>

          {/* Get Messages Endpoint */}
          <div className="border border-border rounded-lg">
            <div className="p-4 bg-muted border-b border-border">
              <h4 className="flex items-center font-medium text-foreground">
                <Badge className="bg-primary text-white mr-3">GET</Badge>
                /messages
              </h4>
              <p className="text-sm text-muted-foreground mt-1">Get received messages</p>
            </div>
            <div className="p-4">
              <h5 className="font-medium text-foreground mb-2">Query Parameters</h5>
              <div className="bg-muted p-3 rounded mb-3">
                <code className="text-sm font-mono">sessionId (optional): Filter by session</code><br />
                <code className="text-sm font-mono">limit (optional): Number of messages to return</code>
              </div>
              <h5 className="font-medium text-foreground mb-2">Response</h5>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                <code>{`{
  "messages": [
    {
      "id": "string",
      "from": "string",
      "to": "string",
      "message": "string",
      "timestamp": "string",
      "sessionId": "string"
    }
  ]
}`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div className="mt-6 bg-accent/10 border border-accent/20 rounded-lg p-4">
          <h4 className="font-medium text-accent mb-2">
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Authentication
          </h4>
          <p className="text-sm text-accent mb-2">Include your API key in the Authorization header:</p>
          <code className="text-sm font-mono bg-accent/20 px-2 py-1 rounded inline-block">
            Authorization: Bearer YOUR_API_KEY
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
