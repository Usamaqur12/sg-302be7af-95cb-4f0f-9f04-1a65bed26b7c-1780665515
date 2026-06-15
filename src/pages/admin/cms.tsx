"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { Edit2, FileText, ImageUp, LayoutTemplate, Plus, Save, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import { getErrorMessage } from "@/lib/errors";
import { defaultFooterSections } from "@/lib/marketplace-config";
import {
  defaultPublicPages,
  normalizePublicPages,
  parsePublicPages,
  publicPagesToJson,
  type PublicPageContact,
  type PublicPageDefinition,
  type PublicPageSection,
} from "@/lib/public-pages";
import { uploadFile } from "@/lib/uploads";

type Banner = Database["public"]["Tables"]["banners"]["Row"];

interface HeroSettings {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  footerText: string;
  footerLinksJson: string;
}

interface BannerForm {
  title: string;
  image_url: string;
  link_url: string;
  display_order: string;
  is_active: boolean;
}

const CMS_KEYS = [
  "homepage_hero_title",
  "homepage_hero_subtitle",
  "homepage_hero_cta_label",
  "homepage_hero_cta_href",
  "footer_about_text",
  "footer_links_json",
  "public_pages_json",
] as const;

const DEFAULT_HERO: HeroSettings = {
  title: "Everything your customers search for, all in one marketplace",
  subtitle: "Discover trusted sellers, daily deals, fast order tracking and admin-approved products built for a serious multivendor store.",
  ctaLabel: "Shop Today's Deals",
  ctaHref: "/deals",
  footerText: "Mercato connects customers with verified sellers, curated products, secure checkout and reliable support.",
  footerLinksJson: JSON.stringify(defaultFooterSections, null, 2),
};

const EMPTY_BANNER: BannerForm = {
  title: "",
  image_url: "",
  link_url: "/deals",
  display_order: "0",
  is_active: true,
};

export default function AdminCmsPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { toast } = useToast();
  const [hero, setHero] = useState(DEFAULT_HERO);
  const [publicPages, setPublicPages] = useState<PublicPageDefinition[]>(defaultPublicPages);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerForm, setBannerForm] = useState(EMPTY_BANNER);
  const [editingBannerId, setEditingBannerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingHero, setSavingHero] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const loadCms = useCallback(async () => {
    setLoading(true);
    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", [...CMS_KEYS]);
      const { data: bannersData, error: bannersError } = await supabase
        .from("banners")
        .select("*")
        .order("display_order", { ascending: true });

      if (settingsError) throw settingsError;

      const settings = new Map<string, string>(
        (settingsData ?? []).map((item) => [String(item.key), String(item.value ?? "")])
      );
      setHero({
        title: settings.get("homepage_hero_title") || DEFAULT_HERO.title,
        subtitle: settings.get("homepage_hero_subtitle") || DEFAULT_HERO.subtitle,
        ctaLabel: settings.get("homepage_hero_cta_label") || DEFAULT_HERO.ctaLabel,
        ctaHref: settings.get("homepage_hero_cta_href") || DEFAULT_HERO.ctaHref,
        footerText: settings.get("footer_about_text") || DEFAULT_HERO.footerText,
        footerLinksJson: settings.get("footer_links_json") || DEFAULT_HERO.footerLinksJson,
      });
      setPublicPages(parsePublicPages(settings.get("public_pages_json")));

      if (bannersError) {
        toast({
          title: "Banners unavailable",
          description: bannersError.message,
          variant: "destructive",
        });
      } else {
        setBanners(bannersData ?? []);
      }
    } catch (error) {
      toast({
        title: "CMS unavailable",
        description: getErrorMessage(error, "Could not load CMS settings."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && user) {
      loadCms();
    }
  }, [authLoading, loadCms, user]);

  const saveHero = async () => {
    setSavingHero(true);
    try {
      const parsedFooterLinks = JSON.parse(hero.footerLinksJson);
      if (!Array.isArray(parsedFooterLinks)) {
        throw new Error("Footer links JSON must be an array of sections.");
      }
      const normalizedPublicPages = normalizePublicPages(publicPages);
      const { error } = await supabase
        .from("system_settings")
        .upsert([
          { key: "homepage_hero_title", value: hero.title, description: "Homepage hero title" },
          { key: "homepage_hero_subtitle", value: hero.subtitle, description: "Homepage hero subtitle" },
          { key: "homepage_hero_cta_label", value: hero.ctaLabel, description: "Homepage hero CTA label" },
          { key: "homepage_hero_cta_href", value: hero.ctaHref, description: "Homepage hero CTA link" },
          { key: "footer_about_text", value: hero.footerText, description: "Footer about text" },
          {
            key: "footer_links_json",
            value: JSON.stringify(parsedFooterLinks, null, 2),
            description: "Editable footer column links as JSON",
          },
          {
            key: "public_pages_json",
            value: publicPagesToJson(normalizedPublicPages),
            description: "Editable public pages such as terms, privacy, contact and custom pages",
          },
        ], { onConflict: "key" });

      if (error) throw error;
      setPublicPages(normalizedPublicPages);
      toast({ title: "CMS settings saved", description: "Homepage, footer and public pages were updated." });
      window.dispatchEvent(new Event("marketplace-settings-updated"));
    } catch (error) {
      toast({
        title: "Save failed",
        description: getErrorMessage(error, "Could not save CMS settings."),
        variant: "destructive",
      });
    } finally {
      setSavingHero(false);
    }
  };

  const updatePublicPage = (pageIndex: number, patch: Partial<PublicPageDefinition>) => {
    setPublicPages((current) =>
      current.map((page, index) => (index === pageIndex ? { ...page, ...patch } : page))
    );
  };

  const updatePublicPageContact = (
    pageIndex: number,
    field: keyof PublicPageContact,
    value: string
  ) => {
    setPublicPages((current) =>
      current.map((page, index) =>
        index === pageIndex
          ? { ...page, contact: { ...(page.contact || {}), [field]: value } }
          : page
      )
    );
  };

  const updatePublicPageSection = (
    pageIndex: number,
    sectionIndex: number,
    patch: Partial<PublicPageSection>
  ) => {
    setPublicPages((current) =>
      current.map((page, index) =>
        index === pageIndex
          ? {
              ...page,
              sections: page.sections.map((section, currentSectionIndex) =>
                currentSectionIndex === sectionIndex ? { ...section, ...patch } : section
              ),
            }
          : page
      )
    );
  };

  const addPublicPage = () => {
    setPublicPages((current) => [
      ...current,
      {
        slug: `custom-page-${current.length + 1}`,
        title: "Custom Page",
        summary: "",
        lastUpdated: "June 2026",
        sections: [{ heading: "Content", body: "" }],
      },
    ]);
  };

  const removePublicPage = (pageIndex: number) => {
    setPublicPages((current) => current.filter((_, index) => index !== pageIndex));
  };

  const addPublicPageSection = (pageIndex: number) => {
    setPublicPages((current) =>
      current.map((page, index) =>
        index === pageIndex
          ? { ...page, sections: [...page.sections, { heading: "New Section", body: "" }] }
          : page
      )
    );
  };

  const removePublicPageSection = (pageIndex: number, sectionIndex: number) => {
    setPublicPages((current) =>
      current.map((page, index) =>
        index === pageIndex
          ? {
              ...page,
              sections: page.sections.filter((_, currentSectionIndex) => currentSectionIndex !== sectionIndex),
            }
          : page
      )
    );
  };

  const uploadBannerImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    try {
      const url = await uploadFile(file, "cms");
      setBannerForm((current) => ({ ...current, image_url: url }));
      toast({ title: "Banner uploaded", description: "Image URL is ready for this banner." });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: getErrorMessage(error, "Could not upload banner image."),
        variant: "destructive",
      });
    } finally {
      setUploadingBanner(false);
      event.target.value = "";
    }
  };

  const editBanner = (banner: Banner) => {
    setEditingBannerId(banner.id);
    setBannerForm({
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url || "/deals",
      display_order: String(banner.display_order ?? 0),
      is_active: Boolean(banner.is_active),
    });
  };

  const resetBannerForm = () => {
    setEditingBannerId("");
    setBannerForm(EMPTY_BANNER);
  };

  const saveBanner = async () => {
    if (!bannerForm.title.trim() || !bannerForm.image_url.trim()) {
      toast({
        title: "Banner title and image required",
        description: "Upload or paste an image URL before saving.",
        variant: "destructive",
      });
      return;
    }

    setSavingBanner(true);
    try {
      const payload = {
        title: bannerForm.title.trim(),
        image_url: bannerForm.image_url.trim(),
        link_url: bannerForm.link_url.trim() || null,
        display_order: Number(bannerForm.display_order) || 0,
        is_active: bannerForm.is_active,
      };
      const result = editingBannerId
        ? await supabase.from("banners").update(payload).eq("id", editingBannerId)
        : await supabase.from("banners").insert(payload);

      if (result.error) throw result.error;
      resetBannerForm();
      await loadCms();
      toast({
        title: editingBannerId ? "Banner updated" : "Banner created",
        description: "Homepage banner list has been updated.",
      });
    } catch (error) {
      toast({
        title: "Banner save failed",
        description: getErrorMessage(error, "Could not save banner."),
        variant: "destructive",
      });
    } finally {
      setSavingBanner(false);
    }
  };

  const deleteBanner = async (banner: Banner) => {
    if (!window.confirm(`Delete "${banner.title}"?`)) return;
    const { error } = await supabase.from("banners").delete().eq("id", banner.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    await loadCms();
    toast({ title: "Banner deleted", description: `${banner.title} was removed.` });
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Homepage CMS</h1>
            <p className="text-muted-foreground">Control homepage hero copy, banners and public content settings.</p>
          </div>

          {loading ? (
            <p className="py-16 text-center text-muted-foreground">Loading CMS controls...</p>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutTemplate className="h-5 w-5" /> Hero & Footer Copy
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label htmlFor="hero_title">Hero Title</Label>
                    <Input
                      id="hero_title"
                      value={hero.title}
                      onChange={(event) => setHero((current) => ({ ...current, title: event.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
                    <Textarea
                      id="hero_subtitle"
                      rows={3}
                      value={hero.subtitle}
                      onChange={(event) => setHero((current) => ({ ...current, subtitle: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hero_cta_label">CTA Label</Label>
                    <Input
                      id="hero_cta_label"
                      value={hero.ctaLabel}
                      onChange={(event) => setHero((current) => ({ ...current, ctaLabel: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hero_cta_href">CTA Link</Label>
                    <Input
                      id="hero_cta_href"
                      value={hero.ctaHref}
                      onChange={(event) => setHero((current) => ({ ...current, ctaHref: event.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="footer_text">Footer About Text</Label>
                    <Textarea
                      id="footer_text"
                      rows={3}
                      value={hero.footerText}
                      onChange={(event) => setHero((current) => ({ ...current, footerText: event.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="footer_links_json">Footer Columns JSON</Label>
                    <Textarea
                      id="footer_links_json"
                      rows={14}
                      value={hero.footerLinksJson}
                      onChange={(event) => setHero((current) => ({
                        ...current,
                        footerLinksJson: event.target.value,
                      }))}
                      className="font-mono text-xs"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Format: array of sections with title and links. Each link needs label and href.
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Button onClick={saveHero} disabled={savingHero}>
                      <Save className="mr-2 h-4 w-4" />
                      {savingHero ? "Saving..." : "Save CMS Copy"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" /> Public Pages
                    </CardTitle>
                    <Button type="button" variant="outline" onClick={addPublicPage}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Page
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {publicPages.map((page, pageIndex) => (
                    <div key={`${page.slug}-${pageIndex}`} className="rounded-md border p-4">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{page.title || "Untitled Page"}</p>
                          <p className="text-sm text-muted-foreground">/{page.slug || "page-slug"}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removePublicPage(pageIndex)}
                          disabled={publicPages.length <= 1}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor={`page-title-${pageIndex}`}>Title</Label>
                          <Input
                            id={`page-title-${pageIndex}`}
                            value={page.title}
                            onChange={(event) => updatePublicPage(pageIndex, { title: event.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`page-slug-${pageIndex}`}>Slug</Label>
                          <Input
                            id={`page-slug-${pageIndex}`}
                            value={page.slug}
                            onChange={(event) => updatePublicPage(pageIndex, { slug: event.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`page-updated-${pageIndex}`}>Last Updated</Label>
                          <Input
                            id={`page-updated-${pageIndex}`}
                            value={page.lastUpdated}
                            onChange={(event) => updatePublicPage(pageIndex, { lastUpdated: event.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor={`page-summary-${pageIndex}`}>Summary</Label>
                          <Textarea
                            id={`page-summary-${pageIndex}`}
                            rows={2}
                            value={page.summary}
                            onChange={(event) => updatePublicPage(pageIndex, { summary: event.target.value })}
                          />
                        </div>
                      </div>

                      <div className="mt-5 rounded-md bg-muted/40 p-4">
                        <p className="mb-3 text-sm font-semibold">Contact Details</p>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor={`page-email-${pageIndex}`}>Email</Label>
                            <Input
                              id={`page-email-${pageIndex}`}
                              value={page.contact?.email || ""}
                              onChange={(event) => updatePublicPageContact(pageIndex, "email", event.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`page-phone-${pageIndex}`}>Phone</Label>
                            <Input
                              id={`page-phone-${pageIndex}`}
                              value={page.contact?.phone || ""}
                              onChange={(event) => updatePublicPageContact(pageIndex, "phone", event.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`page-hours-${pageIndex}`}>Hours</Label>
                            <Textarea
                              id={`page-hours-${pageIndex}`}
                              rows={2}
                              value={page.contact?.hours || ""}
                              onChange={(event) => updatePublicPageContact(pageIndex, "hours", event.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`page-address-${pageIndex}`}>Address</Label>
                            <Textarea
                              id={`page-address-${pageIndex}`}
                              rows={2}
                              value={page.contact?.address || ""}
                              onChange={(event) => updatePublicPageContact(pageIndex, "address", event.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold">Content Sections</p>
                          <Button type="button" size="sm" variant="outline" onClick={() => addPublicPageSection(pageIndex)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Section
                          </Button>
                        </div>
                        {page.sections.map((section, sectionIndex) => (
                          <div key={`${page.slug}-${sectionIndex}`} className="rounded-md border bg-background p-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                              <p className="text-sm font-medium">Section {sectionIndex + 1}</p>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => removePublicPageSection(pageIndex, sectionIndex)}
                                disabled={page.sections.length <= 1}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </Button>
                            </div>
                            <div className="grid gap-4">
                              <div>
                                <Label htmlFor={`page-section-heading-${pageIndex}-${sectionIndex}`}>Heading</Label>
                                <Input
                                  id={`page-section-heading-${pageIndex}-${sectionIndex}`}
                                  value={section.heading}
                                  onChange={(event) =>
                                    updatePublicPageSection(pageIndex, sectionIndex, { heading: event.target.value })
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor={`page-section-body-${pageIndex}-${sectionIndex}`}>Body</Label>
                                <Textarea
                                  id={`page-section-body-${pageIndex}-${sectionIndex}`}
                                  rows={4}
                                  value={section.body}
                                  onChange={(event) =>
                                    updatePublicPageSection(pageIndex, sectionIndex, { body: event.target.value })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <Button onClick={saveHero} disabled={savingHero}>
                    <Save className="mr-2 h-4 w-4" />
                    {savingHero ? "Saving..." : "Save Public Pages"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageUp className="h-5 w-5" /> Homepage Banners
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="banner_title">Banner Title</Label>
                      <Input
                        id="banner_title"
                        value={bannerForm.title}
                        onChange={(event) => setBannerForm((current) => ({ ...current, title: event.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="banner_order">Display Order</Label>
                      <Input
                        id="banner_order"
                        type="number"
                        value={bannerForm.display_order}
                        onChange={(event) => setBannerForm((current) => ({ ...current, display_order: event.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="banner_upload">Upload Banner Image</Label>
                      <Input
                        id="banner_upload"
                        type="file"
                        accept="image/*"
                        disabled={uploadingBanner}
                        onChange={uploadBannerImage}
                      />
                    </div>
                    <div>
                      <Label htmlFor="banner_link">Banner Link</Label>
                      <Input
                        id="banner_link"
                        value={bannerForm.link_url}
                        onChange={(event) => setBannerForm((current) => ({ ...current, link_url: event.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="banner_image_url">Image URL</Label>
                      <Input
                        id="banner_image_url"
                        value={bannerForm.image_url}
                        onChange={(event) => setBannerForm((current) => ({ ...current, image_url: event.target.value }))}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={bannerForm.is_active}
                        onChange={(event) => setBannerForm((current) => ({ ...current, is_active: event.target.checked }))}
                      />
                      Active banner
                    </label>
                  </div>

                  {bannerForm.image_url && (
                    <div className="relative aspect-[5/2] overflow-hidden rounded-md border bg-muted">
                      <Image src={bannerForm.image_url} alt={bannerForm.title || "Banner preview"} fill className="object-cover" unoptimized />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={saveBanner} disabled={savingBanner || uploadingBanner}>
                      <Plus className="mr-2 h-4 w-4" />
                      {savingBanner ? "Saving..." : editingBannerId ? "Update Banner" : "Add Banner"}
                    </Button>
                    {editingBannerId && (
                      <Button variant="outline" onClick={resetBannerForm}>Cancel Edit</Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {banners.map((banner) => (
                      <div key={banner.id} className="flex flex-col gap-4 rounded-md border p-4 md:flex-row md:items-center">
                        <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-md bg-muted md:w-44">
                          <Image src={banner.image_url} alt={banner.title} fill className="object-cover" unoptimized />
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{banner.title}</p>
                            <Badge variant={banner.is_active ? "default" : "secondary"}>
                              {banner.is_active ? "active" : "hidden"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {banner.link_url || "No link"} - order {banner.display_order ?? 0}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" variant="outline" title="Edit banner" onClick={() => editBanner(banner)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" title="Delete banner" onClick={() => deleteBanner(banner)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {banners.length === 0 && (
                      <p className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                        No banners yet. Add one to control the homepage hero image.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
