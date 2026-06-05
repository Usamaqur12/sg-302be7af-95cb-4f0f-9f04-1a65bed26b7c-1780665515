"use client";

import { SellerLayout } from "@/components/SellerLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Search, Send } from "lucide-react";
import { useState } from "react";

export default function SellerMessagesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Mock data - replace with Supabase when messages table exists
  const messages = [
    {
      id: "1",
      customerName: "John Doe",
      subject: "Question about product delivery",
      preview: "Hi, I ordered your product last week and wanted to know...",
      date: "2024-01-15",
      unread: true,
    },
    {
      id: "2",
      customerName: "Jane Smith",
      subject: "Product customization request",
      preview: "Is it possible to customize the color of...",
      date: "2024-01-14",
      unread: false,
    },
  ];

  const handleSendReply = () => {
    // Implement reply logic with Supabase
    setReplyText("");
  };

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <SellerLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">Communicate with your customers</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Messages List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Inbox</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {messages.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No messages yet</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <button
                        key={message.id}
                        onClick={() => setSelectedMessage(message.id)}
                        className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                          selectedMessage === message.id ? "bg-muted" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-semibold text-sm">{message.customerName}</span>
                          {message.unread && (
                            <Badge variant="default" className="ml-2">New</Badge>
                          )}
                        </div>
                        <p className="font-medium text-sm mb-1">{message.subject}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                          {message.preview}
                        </p>
                        <p className="text-xs text-muted-foreground">{message.date}</p>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Message Detail */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedMessage ? "Message Details" : "Select a message"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedMessage ? (
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="font-semibold mb-2">From: John Doe</p>
                      <p className="text-sm text-muted-foreground mb-3">Subject: Question about product delivery</p>
                      <p className="text-sm">
                        Hi, I ordered your product last week and wanted to know when I can expect delivery. 
                        The tracking shows it's still in processing. Could you please update me on the status?
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Your Reply</label>
                      <Textarea
                        placeholder="Type your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={4}
                      />
                      <Button onClick={handleSendReply} className="mt-3">
                        <Send className="h-4 w-4 mr-2" />
                        Send Reply
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Select a message to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SellerLayout>
    </RoleGuard>
  );
}