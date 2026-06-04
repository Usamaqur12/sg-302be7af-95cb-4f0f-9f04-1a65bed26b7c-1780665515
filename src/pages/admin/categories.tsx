"use client";

import { AdminLayout } from "@/components/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Edit2, Trash2 } from "lucide-react";

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", description: "" });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not load categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    try {
      const { error } = await supabase.from("categories").insert([newCategory]);

      if (error) throw error;

      toast({
        title: "Category Added",
        description: "New category has been created successfully",
      });

      setNewCategory({ name: "", slug: "", description: "" });
      setIsAdding(false);
      loadCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not add category",
        variant: "destructive",
      });
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-serif mb-2">Category Management</h1>
              <p className="text-muted-foreground">Manage product categories</p>
            </div>
            <Button onClick={() => setIsAdding(!isAdding)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>

          {isAdding && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="name">Category Name</Label>
                    <Input
                      id="name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="e.g., Electronics"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={newCategory.slug}
                      onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                      placeholder="e.g., electronics"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Category description"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddCategory}>Save Category</Button>
                    <Button variant="outline" onClick={() => setIsAdding(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                </div>
              ) : categories.length > 0 ? (
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                    >
                      <div>
                        <p className="font-semibold">{category.name}</p>
                        <p className="text-sm text-muted-foreground">/{category.slug}</p>
                        {category.description && (
                          <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-12 text-muted-foreground">No categories found</p>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}