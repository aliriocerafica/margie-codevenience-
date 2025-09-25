"use client";

import React, { useState } from "react";
import { Plus, Tag, Grid, TrendingUp, Tag as TagIcon, Pencil, Trash2 } from "lucide-react";
import useSWR from "swr";
import { usePageHighlight } from "@/hooks/usePageHighlight";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { StatCard } from "@/components/ui/StatCard";
import { CategoryTable } from "./tables/CategoryTable";
import { LOADING_MESSAGES, ERROR_MESSAGES } from "@/lib/constants";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const Category = () => {
    const [useBackendData] = useState(true);
    const { data, error, isLoading, mutate } = useSWR(
        useBackendData ? `/api/category` : null, 
        fetcher
    );
    const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
    const [saving, setSaving] = useState(false);
    const [adding, setAdding] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);
    
    // Enable page highlighting for search results
    usePageHighlight();

    const categoryData = data;
    const currentError = error;
    const currentLoading = isLoading;

    const handleAddCategory = () => {
        setNewCategoryName("");
        setAdding(true);
    };

    const handleRetry = () => {
        mutate();
    };

    // Calculate stats
    const totalCategories = categoryData?.length || 0;
    const activeCategories = categoryData?.filter((c: any) => c.status === 'active').length || 0;
    const totalProducts = categoryData?.reduce((sum: number, c: any) => sum + (c.productCount || 0), 0) || 0;
    const avgProductsPerCategory = totalCategories > 0 ? Math.round(totalProducts / totalCategories) : 0;

    if (currentLoading) {
        return <LoadingSpinner message={LOADING_MESSAGES.categories} variant="card" />;
    }

    if (currentError) {
        return (
            <ErrorMessage 
              message={ERROR_MESSAGES.categories} 
              onRetry={handleRetry}
              variant="card"
            />
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Categories"
                description="Organize your products into categories for better management."
                action={{
                    label: "Add Category",
                    onClick: handleAddCategory,
                    icon: Plus,
                    color: "primary"
                }}
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Categories"
                    value={totalCategories}
                    icon={Tag}
                    color="blue"
                />
                <StatCard
                    title="Active"
                    value={activeCategories}
                    icon={Tag}
                    color="green"
                />
                <StatCard
                    title="Total Products"
                    value={totalProducts}
                    icon={Grid}
                    color="purple"
                />
                <StatCard
                    title="Avg Products"
                    value={avgProductsPerCategory}
                    icon={TrendingUp}
                    color="orange"
                />
            </div>

            {/* Categories Table */}
            <CategoryTable 
                data={categoryData}
                isLoading={currentLoading}
                error={currentError}
                onEdit={(c: any) => setEditing({ id: c.id, name: c.name })}
                onRequestDelete={(c: any) => setDeleting({ id: c.id, name: c.name })}
            />

            {/* Add Category - HeroUI Modal */}
            <Modal 
              isOpen={adding} 
              onClose={() => setAdding(false)}
              size="md"
              backdrop="blur"
              classNames={{
                backdrop: "bg-black/50 backdrop-blur-sm",
                base: "border-none",
                header: "border-b border-gray-200 dark:border-gray-700",
                footer: "border-t border-gray-200 dark:border-gray-700",
                closeButton: "hover:bg-gray-100 dark:hover:bg-gray-800",
              }}
            >
              <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <TagIcon className="w-5 h-5 text-[#003366] dark:text-[#4A90E2]" />
                    <span className="text-lg font-semibold">Add Category</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                    Create a new category to organize your products
                  </p>
                </ModalHeader>
                <ModalBody className="py-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name</label>
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    size="lg"
                    placeholder="e.g. Electronics"
                    classNames={{
                      input: "text-sm py-3 px-3",
                      inputWrapper: "h-12 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700"
                    }}
                  />
                </ModalBody>
                <ModalFooter className="justify-end gap-2">
                  <Button variant="light" onPress={() => setAdding(false)} disabled={saving}>Cancel</Button>
                  <Button
                    color="primary"
                    className="bg-gradient-to-r from-[#003366] to-[#004488] hover:from-[#002244] hover:to-[#003366] text-white"
                    isDisabled={saving || !newCategoryName.trim()}
                    onPress={async () => {
                      setSaving(true);
                      try {
                        const res = await fetch('/api/category', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name: newCategoryName.trim() }),
                        });
                        if (!res.ok) throw new Error('Failed to add');
                        setAdding(false);
                        setNewCategoryName("");
                        mutate();
                      } catch (_) {
                        alert('Failed to add category');
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    Save
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            {/* Edit Category - HeroUI Modal */}
            <Modal 
              isOpen={!!editing} 
              onClose={() => setEditing(null)}
              size="md"
              backdrop="blur"
              classNames={{
                backdrop: "bg-black/50 backdrop-blur-sm",
                base: "border-none",
                header: "border-b border-gray-200 dark:border-gray-700",
                footer: "border-t border-gray-200 dark:border-gray-700",
                closeButton: "hover:bg-gray-100 dark:hover:bg-gray-800",
              }}
            >
              <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Pencil className="w-5 h-5 text-[#003366] dark:text-[#4A90E2]" />
                    <span className="text-lg font-semibold">Edit Category</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                    Update the category name
                  </p>
                </ModalHeader>
                <ModalBody className="py-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name</label>
                  <Input
                    value={editing?.name ?? ""}
                    onChange={(e) => setEditing(prev => prev ? { ...prev, name: e.target.value } : prev)}
                    size="lg"
                    placeholder="Category name"
                    classNames={{
                      input: "text-sm py-3 px-3",
                      inputWrapper: "h-12 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700"
                    }}
                  />
                </ModalBody>
                <ModalFooter className="justify-end gap-2">
                  <Button variant="light" onPress={() => setEditing(null)} disabled={saving}>Cancel</Button>
                  <Button
                    color="primary"
                    className="bg-gradient-to-r from-[#003366] to-[#004488] hover:from-[#002244] hover:to-[#003366] text-white"
                    isDisabled={saving || !editing?.name.trim()}
                    onPress={async () => {
                      if (!editing) return;
                      setSaving(true);
                      try {
                        const res = await fetch('/api/category', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: editing.id, name: editing.name.trim() }),
                        });
                        if (!res.ok) throw new Error('Failed to update');
                        setEditing(null);
                        mutate();
                      } catch (_) {
                        alert('Failed to update category');
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    Save
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            {/* Delete Category - HeroUI Modal */}
            <Modal 
              isOpen={!!deleting} 
              onClose={() => setDeleting(null)}
              size="md"
              backdrop="blur"
              classNames={{
                backdrop: "bg-black/50 backdrop-blur-sm",
                base: "border-none",
                header: "border-b border-gray-200 dark:border-gray-700",
                footer: "border-t border-gray-200 dark:border-gray-700",
                closeButton: "hover:bg-gray-100 dark:hover:bg-gray-800",
              }}
            >
              <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-rose-600" />
                    <span className="text-lg font-semibold">Delete Category</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                    Are you sure you want to delete "{deleting?.name}"? This action cannot be undone.
                  </p>
                </ModalHeader>
                <ModalBody className="py-6">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    This will permanently remove the category from your catalog.
                  </div>
                </ModalBody>
                <ModalFooter className="justify-end gap-2">
                  <Button variant="light" onPress={() => setDeleting(null)} disabled={saving}>Cancel</Button>
                  <Button
                    color="danger"
                    className="text-white"
                    isDisabled={saving}
                    onPress={async () => {
                      if (!deleting) return;
                      setSaving(true);
                      try {
                        const res = await fetch(`/api/category?id=${deleting.id}`, { method: 'DELETE' });
                        if (!res.ok) throw new Error('Failed to delete');
                        setDeleting(null);
                        mutate();
                      } catch (_) {
                        alert('Failed to delete category');
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
        </div>
    );
};

export default Category;