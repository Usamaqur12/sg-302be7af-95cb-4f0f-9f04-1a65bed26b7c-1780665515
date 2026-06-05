"use client";

import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Search, Send, Clock, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function AdminSupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data - replace with Supabase when support_tickets table exists
  const tickets = [
    {
      id: "1",
      customerName: "John Doe",
      subject: "Product not received",
      status: "open",
      priority: "high",
      date: "2024-01-15",
      category: "order",
    },
    {
      id: "2",
      customerName: "Jane Smith",
      subject: "Refund request",
      status: "in_progress",
      priority: "medium",
      date: "2024-01-14",
      category: "payment",
    },
    {
      id: "3",
      customerName: "Bob Wilson",
      subject: "Account access issue",
      status: "resolved",
      priority: "low",
      date: "2024-01-13",
      category: "account",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      open: { variant: "destructive", icon: Clock },
      in_progress: { variant: "default", icon: Clock },
      resolved: { variant: "secondary", icon: CheckCircle2 },
    };

    const { variant, icon: Icon } = variants[status] || variants.open;
    
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: "text-destructive",
      medium: "text-amber-600",
      low: "text-muted-foreground",
    };
    return colors[priority] || colors.medium;
  };

  const handleResolveTicket = () => {
    // Implement resolve logic with Supabase
    setReplyText("");
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
    if (searchQuery && !ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Support Tickets</h1>
            <p className="text-muted-foreground">Manage customer support requests</p>
          </div>

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Tickets List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredTickets.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No tickets found</p>
                    </div>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket.id)}
                        className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                          selectedTicket === ticket.id ? "bg-muted" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-semibold text-sm">{ticket.customerName}</span>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <p className="font-medium text-sm mb-1">{ticket.subject}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-medium uppercase ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          <span className="text-muted-foreground">{ticket.date}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ticket Detail */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedTicket ? "Ticket Details" : "Select a ticket"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTicket ? (
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">From: John Doe</p>
                          <p className="text-sm text-muted-foreground">john@example.com</p>
                        </div>
                        <Badge variant="destructive">High Priority</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Subject</p>
                        <p className="font-semibold">Product not received</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Category</p>
                        <Badge variant="outline">Order</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Message</p>
                        <p className="text-sm">
                          I placed an order (#ORD-12345) two weeks ago and haven't received it yet. 
                          The tracking shows it was delivered but I never received the package. 
                          Can you please help me resolve this issue?
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Response</label>
                      <Textarea
                        placeholder="Type your response..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={4}
                      />
                      <div className="flex gap-2 mt-3">
                        <Button onClick={handleResolveTicket}>
                          <Send className="h-4 w-4 mr-2" />
                          Send & Keep Open
                        </Button>
                        <Button onClick={handleResolveTicket} variant="secondary">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Send & Resolve
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Select a ticket to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}