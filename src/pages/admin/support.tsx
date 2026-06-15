"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, MessageSquare, Search, Send } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import { getErrorMessage } from "@/lib/errors";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];

interface TicketMessage {
  id: string;
  message: string;
  user_id: string;
  is_internal: boolean | null;
  created_at: string | null;
  author: {
    full_name: string | null;
    email: string | null;
    role: string | null;
  } | null;
}

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: string | null;
  priority: string | null;
  status: TicketStatus | null;
  created_at: string | null;
  customer: {
    full_name: string | null;
    email: string | null;
  } | null;
  messages: TicketMessage[];
}

const statusConfig: Record<TicketStatus, {
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: typeof Clock;
}> = {
  open: { variant: "destructive", icon: Clock },
  in_progress: { variant: "default", icon: Clock },
  resolved: { variant: "secondary", icon: CheckCircle2 },
  closed: { variant: "outline", icon: CheckCircle2 },
};

export default function AdminSupportPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: ticketError } = await supabase
      .from("support_tickets")
      .select(`
        id,
        ticket_number,
        subject,
        description,
        category,
        priority,
        status,
        created_at,
        customer:profiles!support_tickets_user_id_fkey(full_name, email),
        messages:ticket_messages(
          id,
          message,
          user_id,
          is_internal,
          created_at,
          author:profiles(full_name, email, role)
        )
      `)
      .order("created_at", { ascending: false });

    if (ticketError) {
      setError(ticketError.message);
      setLoading(false);
      return;
    }

    const nextTickets = ((data ?? []) as unknown as SupportTicket[]).map((ticket) => ({
      ...ticket,
      messages: [...(ticket.messages ?? [])].sort((a, b) =>
        (a.created_at ?? "").localeCompare(b.created_at ?? "")
      ),
    }));

    setTickets(nextTickets);
    setSelectedTicketId((current) => current || nextTickets[0]?.id || "");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadTickets();
    }
  }, [authLoading, loadTickets, user]);

  const filteredTickets = tickets.filter((ticket) => {
    const customer = ticket.customer?.full_name || ticket.customer?.email || "";
    const search = searchQuery.toLowerCase();
    return (
      (statusFilter === "all" || ticket.status === statusFilter) &&
      (
        !search ||
        ticket.ticket_number.toLowerCase().includes(search) ||
        ticket.subject.toLowerCase().includes(search) ||
        customer.toLowerCase().includes(search)
      )
    );
  });

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [selectedTicketId, tickets]
  );

  const submitReply = async (resolve: boolean) => {
    if (!user || !selectedTicket || !replyText.trim()) return;

    setSubmitting(true);
    try {
      const { error: messageError } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message: replyText.trim(),
          is_internal: false,
        });

      if (messageError) throw messageError;

      const nextStatus: TicketStatus = resolve ? "resolved" : "in_progress";
      const { error: statusError } = await supabase
        .from("support_tickets")
        .update({
          assigned_to: user.id,
          status: nextStatus,
          resolved_at: resolve ? new Date().toISOString() : null,
        })
        .eq("id", selectedTicket.id);

      if (statusError) throw statusError;

      setReplyText("");
      await loadTickets();
      toast({
        title: resolve ? "Ticket resolved" : "Reply sent",
        description: `${selectedTicket.ticket_number} was updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Support update failed",
        description: getErrorMessage(error, "Could not update this ticket."),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: TicketStatus | null) => {
    const resolvedStatus = status ?? "open";
    const config = statusConfig[resolvedStatus];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {resolvedStatus.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Support Tickets</h1>
              <p className="text-muted-foreground">Reply to and resolve customer requests.</p>
            </div>
            <Button variant="outline" onClick={loadTickets}>Refresh</Button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search ticket, subject, or customer..."
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as TicketStatus | "all")}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="py-16 text-center text-muted-foreground">Loading support tickets...</p>
          ) : error ? (
            <Card className="border-destructive">
              <CardContent className="pt-6 text-destructive">{error}</CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader><CardTitle>Tickets ({filteredTickets.length})</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {filteredTickets.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <MessageSquare className="mx-auto mb-3 h-10 w-10" />
                      No tickets found.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredTickets.map((ticket) => (
                        <button
                          key={ticket.id}
                          type="button"
                          onClick={() => setSelectedTicketId(ticket.id)}
                          className={`w-full p-4 text-left transition-colors hover:bg-muted/50 ${
                            selectedTicketId === ticket.id ? "bg-muted" : ""
                          }`}
                        >
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <span className="font-mono text-xs font-semibold">{ticket.ticket_number}</span>
                            {statusBadge(ticket.status)}
                          </div>
                          <p className="font-medium">{ticket.subject}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {ticket.customer?.full_name || ticket.customer?.email || "Customer"}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{selectedTicket?.subject || "Select a ticket"}</CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedTicket ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <MessageSquare className="mx-auto mb-3 h-10 w-10" />
                      Select a ticket to view the conversation.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="rounded-md bg-muted p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">
                              {selectedTicket.customer?.full_name || "Customer"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {selectedTicket.customer?.email}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">{selectedTicket.priority || "medium"}</Badge>
                            {selectedTicket.category && (
                              <Badge variant="outline">{selectedTicket.category}</Badge>
                            )}
                          </div>
                        </div>
                        <p className="mt-4 text-sm">{selectedTicket.description}</p>
                      </div>

                      {selectedTicket.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`rounded-md border p-4 ${
                            message.author?.role === "admin" ? "ml-6 bg-primary/5" : "mr-6"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold">
                              {message.author?.full_name || message.author?.email || "User"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {message.created_at ? new Date(message.created_at).toLocaleString() : ""}
                            </p>
                          </div>
                          <p className="mt-2 text-sm">{message.message}</p>
                        </div>
                      ))}

                      <div>
                        <Textarea
                          value={replyText}
                          onChange={(event) => setReplyText(event.target.value)}
                          placeholder="Write a response..."
                          rows={5}
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            onClick={() => submitReply(false)}
                            disabled={submitting || !replyText.trim()}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send & Keep Open
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => submitReply(true)}
                            disabled={submitting || !replyText.trim()}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Send & Resolve
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
