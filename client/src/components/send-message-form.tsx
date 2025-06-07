import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendMessageSchema } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface SendMessageFormProps {
  sessions: any[];
}

export default function SendMessageForm({ sessions }: SendMessageFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const { data: templates } = useQuery({
    queryKey: ['/api/templates'],
  });

  const form = useForm({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: {
      sessionId: "",
      to: "",
      message: "",
      media: "",
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      formData.append('sessionId', data.sessionId);
      formData.append('to', data.to);
      formData.append('message', data.message);
      
      if (selectedFile) {
        formData.append('media', selectedFile);
      }

      const response = await fetch('/api/send-message', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your WhatsApp message has been sent successfully!",
      });
      form.reset();
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    sendMessageMutation.mutate(data);
  };

  const useTemplate = (content: string) => {
    form.setValue('message', content);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
  };

  const messageLength = form.watch('message')?.length || 0;

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-foreground">Send WhatsApp Message</h3>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="sessionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Session</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose WhatsApp account to send from" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            {session.name} ({session.phone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., +62 812 3456 7890"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Include country code (e.g., +62 for Indonesia)</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder="Type your message here..."
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Emojis and formatting supported</span>
                      <span>{messageLength}/1000</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label>Media (Optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary hover:bg-primary/5 transition-colors mt-2">
                  <Input
                    type="file"
                    className="hidden"
                    id="media-upload"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  <Label htmlFor="media-upload" className="cursor-pointer">
                    <svg className="w-12 h-12 text-muted-foreground mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-muted-foreground">
                      {selectedFile ? selectedFile.name : "Click to upload media file"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports images, videos, audio, and documents (max 16MB)
                    </p>
                  </Label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="schedule" />
                    <Label htmlFor="schedule" className="text-sm">Schedule message</Label>
                  </div>
                  <Button type="button" variant="ghost" size="sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Set time
                  </Button>
                </div>
                <div className="flex space-x-3">
                  <Button type="button" variant="outline">
                    Save Draft
                  </Button>
                  <Button
                    type="submit"
                    disabled={sendMessageMutation.isPending || !form.formState.isValid}
                  >
                    {sendMessageMutation.isPending ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    ) : (
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                    Send Message
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card className="mt-6">
        <CardHeader>
          <h4 className="text-lg font-semibold text-foreground">Quick Templates</h4>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates?.templates?.map((template: any) => (
              <div
                key={template.id}
                className="border border-border rounded-lg p-4 hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
                onClick={() => useTemplate(template.content)}
              >
                <h5 className="font-medium text-foreground mb-2">{template.name}</h5>
                <p className="text-sm text-muted-foreground line-clamp-2">{template.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
