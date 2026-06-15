"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit2, Loader2, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import { getErrorMessage } from "@/lib/errors";

type Category = Database["public"]["Tables"]["categories"]["Row"];

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  parent_id: string;
  display_order: string;
}

const EMPTY_FORM: CategoryForm = { name: "", slug: "", description: "", parent_id: "", display_order: "0" };

export default function AdminCategoriesPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      toast({
        title: "Categories unavailable",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setCategories(data ?? []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (!authLoading && user) {
      loadCategories();
    }
  }, [authLoading, loadCategories, user]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId("");
    setShowForm(false);
  };

  const editCategory = (category: Category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      parent_id: category.parent_id ?? "",
      display_order: String(category.display_order ?? 0),
    });
    setShowForm(true);
  };

  const childrenByParent = categories.reduce((map, category) => {
    const key = category.parent_id || "root";
    const current = map.get(key) ?? [];
    current.push(category);
    map.set(key, current);
    return map;
  }, new Map<string, Category[]>());

  const getDescendantIds = (categoryId: string) => {
    const ids = new Set<string>();
    const walk = (parentId: string) => {
      for (const child of childrenByParent.get(parentId) ?? []) {
        ids.add(child.id);
        walk(child.id);
      }
    };
    walk(categoryId);
    return ids;
  };

  const excludedParentIds = editingId
    ? new Set([editingId, ...Array.from(getDescendantIds(editingId))])
    : new Set<string>();

  const getCategoryPath = (category: Category) => {
    const path = [category.name];
    const visited = new Set<string>([category.id]);
    let current = category.parent_id
      ? categories.find((candidate) => candidate.id === category.parent_id)
      : undefined;

    while (current && !visited.has(current.id)) {
      path.unshift(current.name);
      visited.add(current.id);
      const parentId = current.parent_id;
      current = parentId ? categories.find((candidate) => candidate.id === parentId) : undefined;
    }

    return path.join(" / ");
  };

  const saveCategory = async () => {
    const name = form.name.trim();
    const slug = form.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!name || !slug) {
      toast({
        title: "Name and slug required",
        description: "Enter a valid category name and URL slug.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        slug,
        description: form.description.trim() || null,
        parent_id: form.parent_id || null,
        display_order: Number.parseInt(form.display_order || "0", 10) || 0,
      };
      const result = editingId
        ? await supabase.from("categories").update(payload).eq("id", editingId)
        : await supabase.from("categories").insert(payload);

      if (result.error) throw result.error;

      toast({
        title: editingId ? "Category updated" : "Category created",
        description: `${name} was saved successfully.`,
      });
      resetForm();
      await loadCategories();
    } catch (error) {
      toast({
        title: "Save failed",
        description: getErrorMessage(error, "Could not save category."),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (category: Category) => {
    if (!window.confirm(`Delete "${category.name}"?`)) return;

    const { error } = await supabase.from("categories").delete().eq("id", category.id);
    if (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Category deleted", description: `${category.name} was removed.` });
    await loadCategories();
  };

  const renderCategory = (category: Category, depth = 0) => {
    const children = childrenByParent.get(category.id) ?? [];

    return (
      <div key={category.id}>
        <div
          className="flex items-center justify-between gap-4 border-b py-4 last:border-0"
          style={{ paddingLeft: `${depth * 20}px` }}
        >
          <div>
            <p className="font-semibold">
              {depth > 0 && <span className="mr-2 text-muted-foreground">{"-".repeat(depth)}</span>}
              {category.name}
            </p>
            <p className="text-sm text-muted-foreground">/{category.slug}</p>
            <p className="mt-1 text-xs text-muted-foreground">{getCategoryPath(category)}</p>
            {category.description && (
              <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
            )}
            {children.length > 0 && (
              <p className="mt-1 text-xs text-accent">{children.length} child categories</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              title="Edit category"
              onClick={() => editCategory(category)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="Delete category"
              onClick={() => deleteCategory(category)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {children.map((child) => renderCategory(child, depth + 1))}
      </div>
    );
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Category Management</h1>
              <p className="text-muted-foreground">Create and maintain product categories.</p>
            </div>
            <Button onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              {showForm ? "Close Form" : "Add Category"}
            </Button>
          </div>

          {showForm && (
            <Card>
              <CardContent className="grid gap-4 pt-6">
                <div>
                  <Label htmlFor="parent">Parent Category</Label>
                  <Select
                    value={form.parent_id || "root"}
                    onValueChange={(value) => setForm((current) => ({
                      ...current,
                      parent_id: value === "root" ? "" : value,
                    }))}
                  >
                    <SelectTrigger id="parent">
                      <SelectValue placeholder="Top level category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="root">Top level category</SelectItem>
                      {categories
                        .filter((category) => !excludedParentIds.has(category.id))
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {getCategoryPath(category)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={form.display_order}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      display_order: event.target.value,
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      slug: event.target.value,
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveCategory} disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Update Category" : "Create Category"}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center py-24">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
              ) : categories.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">No categories found.</p>
              ) : (
                <div className="space-y-3">
                  {(childrenByParent.get("root") ?? []).map((category) => renderCategory(category))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
