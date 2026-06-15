"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, LifeBuoy, Loader2, Send, Ticket } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { SellerLayout } from "@/components/SellerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sellerCenterModules } from "@/lib/seller-center";

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category?: string | null;
  priority: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at?: string | null;
}

const supportModule = sellerCenterModules.find((module) => module.href === "/seller/support");

function statusClass(status: SupportTicket["status"]) {
  if (status === "resolved" || status === "closed") return "bg-green-500/10 text-green-700";
  if (status === "in_progress") return "bg-blue-500/10 text-blue-700";
  return "bg-amber-500/10 text-amber-700";
}

export default function SellerSupportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    category: "general",
    priority: "medium",
    description: "",
  });

  const currentHref = router.asPath.split("#")[0];
  const activeOption =
    supportModule?.options.find((option) => option.href === currentHref) ??
    supportModule?.options.find((option) => option.href === "/seller/support");

  const loadTickets = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, ticket_number, subject, description, category, priority, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Support unavailable",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setTickets((data ?? []) as unknown as SupportTicket[]);
    setLoading(false);
  }, [toast, user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadTickets();
    }
  }, [authLoading, loadTickets, user]);

  const submitTicket = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      toast({
        title: "Ticket details required",
        description: "Add a subject and description before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("support_tickets").insert({
      subject: form.subject.trim(),
      description: form.description.trim(),
      category: form.category,
      priority: form.priority,
      status: "open",
    });

    setSubmitting(false);
    if (error) {
      toast({
        title: "Ticket not submitted",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Ticket submitted",
      description: "Your support request is now in the queue.",
    });
    setForm({ subject: "", category: "general", priority: "medium", description: "" });
    loadTickets();
  };

  if (authLoading || (user && loading)) {
    return (
      <RoleGuard allowedRoles={["seller"]}>
        <SellerLayout>
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading support center...
          </div>
        </SellerLayout>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <SellerLayout>
        <div className="space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="mb-3 bg-accent text-accent-foreground">Seller Center</Badge>
              <h1 className="text-3xl font-bold">Setting and Support</h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">
                Create support tickets, submit claims, open policies and keep seller assistance in one place.
              </p>
            </div>
            <Button variant="outline" onClick={loadTickets}>
              <LifeBuoy className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {activeOption && (
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-semibold">{activeOption.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{activeOption.description}</p>
                </div>
                <Badge variant="secondary">Active workflow</Badge>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Support Options</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {(supportModule?.options ?? []).map((option) => (
                <Link
                  key={option.href}
                  href={option.href}
                  className="rounded-md border p-4 transition hover:border-accent hover:bg-muted"
                >
                  <span className="flex items-center justify-between gap-3 font-semibold">
                    {option.title}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <span className="mt-2 block text-sm text-muted-foreground">{option.description}</span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-accent" />
                  Create Ticket
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitTicket} className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={form.subject}
                      onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                      placeholder="Order, payment, product or account issue"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        value={form.category}
                        onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="general">General</option>
                        <option value="claim">Submit a Claim</option>
                        <option value="order">Order</option>
                        <option value="payment">Payment</option>
                        <option value="product">Product</option>
                        <option value="policy">Policy</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <select
                        id="priority"
                        value={form.priority}
                        onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Explain the issue and include order/product references if available."
                      rows={6}
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {submitting ? "Submitting..." : "Submit Ticket"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-accent" />
                  Support Tickets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tickets.length === 0 ? (
                  <div className="rounded-md border p-8 text-center text-muted-foreground">
                    No support tickets yet.
                  </div>
                ) : tickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-md border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{ticket.subject}</p>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">{ticket.ticket_number}</p>
                      </div>
                      <Badge className={statusClass(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{ticket.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">{ticket.category || "general"}</Badge>
                      <Badge variant="outline">{ticket.priority}</Badge>
                      <span>
                        {ticket.created_at
                          ? new Date(ticket.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "New ticket"}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </SellerLayout>
    </RoleGuard>
  );
}
