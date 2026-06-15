"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ClipboardList,
  ExternalLink,
  FileCheck2,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { SellerLayout } from "@/components/SellerLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  sellerCenterRowsWithSellerOverride,
  sellerCenterModules,
  sellerCenterSettingKeys,
  visibleSellerCenterModules,
} from "@/lib/seller-center";

interface SellerCenterModulePageProps {
  moduleHref: string;
}

interface SellerCenterSetting {
  key: string;
  value: unknown;
}

const operationsWorkflows = {
  "/seller/account-health": {
    owner: "Seller operations",
    cadence: "Daily policy review",
    sla: "Resolve critical flags before the next order cycle",
    signals: [
      "Review non-compliance points, account notices and order volume limit in one pass.",
      "Confirm late shipment, cancellation and buyer complaint patterns before raising a claim.",
      "Link every policy issue to a corrective action, owner and next check date.",
    ],
    policyEvidence: ["Recent order examples", "Customer messages", "Listing or KYC documents"],
    escalations: [
      { label: "Policy clarification", href: "/seller/guidelines" },
      { label: "Submit account claim", href: "/seller/support?tool=claim" },
    ],
  },
  "/seller/orders": {
    owner: "Fulfillment operations",
    cadence: "Every packing window",
    sla: "Keep pending orders moving before cutoff",
    signals: [
      "Prioritize pending and processing orders by ship-by urgency.",
      "Add tracking before marking shipments complete.",
      "Watch cancelled orders for repeat stock or courier issues.",
    ],
    policyEvidence: ["Tracking number", "Packing proof", "Cancellation reason"],
    escalations: [
      { label: "Open order claim", href: "/seller/support?tool=claim" },
      { label: "Check health impact", href: "/seller/account-health" },
    ],
  },
  "/seller/support": {
    owner: "Seller support",
    cadence: "As exceptions occur",
    sla: "Attach evidence before submitting",
    signals: [
      "Choose the claim category that matches the operational exception.",
      "Include order, payout, return or policy details in the first ticket.",
      "Track in-progress cases until support closes or requests more evidence.",
    ],
    policyEvidence: ["Order number", "Screenshots or documents", "Expected resolution"],
    escalations: [
      { label: "Review policies", href: "/seller/guidelines" },
      { label: "Return to account health", href: "/seller/account-health" },
    ],
  },
} as const;

export function SellerCenterModulePage({ moduleHref }: SellerCenterModulePageProps) {
  const router = useRouter();
  const { user } = useAuthContext();
  const [settings, setSettings] = useState<SellerCenterSetting[]>([]);
  const [sellerEnabledOptions, setSellerEnabledOptions] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    supabase
      .from("system_settings")
      .select("key, value")
      .in("key", [...sellerCenterSettingKeys])
      .then(({ data }) => {
        if (active) setSettings((data ?? []) as SellerCenterSetting[]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user || user.role !== "seller") return;
    let active = true;

    supabase
      .from("seller_profiles")
      .select("seller_center_enabled_options")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setSellerEnabledOptions(String(data?.seller_center_enabled_options ?? ""));
      });

    return () => {
      active = false;
    };
  }, [user]);

  const modules = visibleSellerCenterModules(
    sellerCenterRowsWithSellerOverride(settings, sellerEnabledOptions)
  );
  const fallbackModule = sellerCenterModules.find((item) => item.href === moduleHref) ?? sellerCenterModules[0];
  const activeModule = modules.find((item) => item.href === moduleHref) ?? {
    ...fallbackModule,
    options: [],
  };
  const currentHref = router.asPath.split("#")[0];
  const activeOption =
    activeModule.options.find((option) => option.href === currentHref) ??
    activeModule.options.find((option) => option.href === activeModule.href) ??
    activeModule.options[0];
  const relatedModules = modules
    .filter((item) => item.href !== activeModule.href)
    .slice(0, 4);
  const workflowSteps = activeOption
    ? [
        `Open ${activeOption.title}`,
        "Review current store data",
        "Prepare updates for this workflow",
        "Track results from your dashboard",
      ]
    : [];
  const operationsWorkflow =
    operationsWorkflows[moduleHref as keyof typeof operationsWorkflows] ??
    (activeOption?.href.includes("/seller/guidelines")
      ? operationsWorkflows["/seller/account-health"]
      : null);

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <SellerLayout>
        <div className="space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="mb-3 bg-accent text-accent-foreground">Seller Center</Badge>
              <h1 className="text-3xl font-bold">{activeModule.title}</h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">{activeModule.description}</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/seller">
                Back to Home
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {activeModule.features.map((feature) => (
              <Card key={feature}>
                <CardContent className="p-5">
                  <CheckCircle className="mb-4 h-7 w-7 text-accent" />
                  <h2 className="font-semibold">{feature}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Seller workflow connected to your marketplace operations.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Available Options</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {activeModule.options.length ? (
                activeModule.options.map((option) => (
                  <Button key={option.href} variant="outline" asChild className="h-auto justify-between p-4 text-left">
                    <Link href={option.href}>
                      <span className="min-w-0">
                        <span className="block font-semibold">{option.title}</span>
                        <span className="mt-1 block text-sm font-normal text-muted-foreground">
                          {option.description}
                        </span>
                      </span>
                      <ArrowRight className="ml-3 h-4 w-4 shrink-0" />
                    </Link>
                  </Button>
                ))
              ) : (
                <div className="col-span-full rounded-md border p-6 text-center text-muted-foreground">
                  No options are available in this section right now.
                </div>
              )}
            </CardContent>
          </Card>

          {activeOption && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-accent" />
                  {activeOption.title} Workspace
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
                <div className="rounded-md border p-5">
                  <p className="font-semibold">{activeOption.description}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This workflow is connected with your seller account, marketplace data and cPanel-ready local database structure.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button asChild>
                      <Link href={activeOption.href}>
                        Open workflow
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/seller/support">Need help</Link>
                    </Button>
                  </div>
                </div>
                <div className="space-y-3 rounded-md border p-5">
                  <p className="font-semibold">Workflow Checklist</p>
                  {workflowSteps.map((step) => (
                    <div key={step} className="flex items-center gap-3 text-sm">
                      <CheckCircle className="h-4 w-4 shrink-0 text-accent" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeOption && operationsWorkflow && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  Operations and Policy Workflow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-md border p-4">
                    <p className="text-sm text-muted-foreground">Owner</p>
                    <p className="mt-1 font-semibold">{operationsWorkflow.owner}</p>
                  </div>
                  <div className="rounded-md border p-4">
                    <p className="text-sm text-muted-foreground">Cadence</p>
                    <p className="mt-1 font-semibold">{operationsWorkflow.cadence}</p>
                  </div>
                  <div className="rounded-md border p-4">
                    <p className="text-sm text-muted-foreground">SLA</p>
                    <p className="mt-1 font-semibold">{operationsWorkflow.sla}</p>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-[1fr_0.75fr]">
                  <div className="rounded-md border p-5">
                    <div className="mb-4 flex items-center gap-2 font-semibold">
                      <AlertTriangle className="h-4 w-4 text-accent" />
                      Review Signals
                    </div>
                    <div className="space-y-3">
                      {operationsWorkflow.signals.map((signal) => (
                        <div key={signal} className="flex gap-3 text-sm">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          <span>{signal}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-md border p-5">
                    <div className="mb-4 flex items-center gap-2 font-semibold">
                      <FileCheck2 className="h-4 w-4 text-accent" />
                      Evidence to Keep Ready
                    </div>
                    <div className="space-y-2">
                      {operationsWorkflow.policyEvidence.map((item) => (
                        <Badge key={item} variant="secondary" className="mr-2">
                          {item}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {operationsWorkflow.escalations.map((item) => (
                        <Button key={item.href} asChild variant="outline" size="sm">
                          <Link href={item.href}>{item.label}</Link>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-accent" />
                Module Status
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Visibility</p>
                <p className="mt-1 font-semibold">Available in your workspace</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Approval policy</p>
                <p className="mt-1 font-semibold">Approval workflow applies</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Data source</p>
                <p className="mt-1 font-semibold">Local/cPanel database</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Related seller tools</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {relatedModules.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md border p-4 transition hover:border-accent hover:bg-muted"
                >
                  <span className="flex items-center justify-between gap-3 font-semibold">
                    {item.title}
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <span className="mt-2 block text-sm text-muted-foreground">{item.description}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </SellerLayout>
    </RoleGuard>
  );
}
