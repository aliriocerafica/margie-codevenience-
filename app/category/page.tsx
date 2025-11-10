"use client";

import React, { useState } from "react";
import { Plus, Tag, Tag as TagIcon, Pencil, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import useSWR from "swr";
import { usePageHighlight } from "@/hooks/usePageHighlight";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { StatCard } from "@/components/ui/StatCard";
import { CategoryTable } from "./tables/CategoryTable";
import { LOADING_MESSAGES, ERROR_MESSAGES } from "@/lib/constants";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Card, CardBody } from "@heroui/react";

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
    
    const showNotification = (title: string, type: 'success' | 'error') => {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
            type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`;
        notification.innerHTML = `<div class="flex items-center gap-2"><span class="font-semibold">${title}</span></div>`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    };
    
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
    // Active = categories with products (hasProducts = true)
    const activeCategories = categoryData?.filter((c: any) => (c.productCount || 0) > 0).length || 0;
    // Inactive = categories without products (hasProducts = false)
    const inactiveCategories = categoryData?.filter((c: any) => (c.productCount || 0) === 0).length || 0;

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    title="Inactive"
                    value={inactiveCategories}
                    icon={Tag}
                    color="gray"
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
              onClose={() => !saving && setAdding(false)}
              size="md"
              backdrop="blur"
            >
              <ModalContent>
                <ModalHeader>
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-[#003366] dark:text-[#4A90E2]" />
                    <span>Add Category</span>
                  </div>
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
                <ModalFooter>
                  <Button variant="light" onPress={() => !saving && setAdding(false)} isDisabled={saving}>Cancel</Button>
                  <Button
                    color="primary"
                    isLoading={saving}
                    isDisabled={saving || !newCategoryName.trim()}
                    startContent={!saving && <CheckCircle className="w-4 h-4" />}
                    onPress={async () => {
                      setSaving(true);
                      try {
                        const res = await fetch('/api/category', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name: newCategoryName.trim() }),
                        });
                        if (!res.ok) throw new Error('Failed to add');
                        showNotification('Category created successfully!', 'success');
                        setAdding(false);
                        setNewCategoryName("");
                        mutate();
                      } catch (_) {
                        showNotification('Failed to create category', 'error');
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    {saving ? 'Creating Category...' : 'Create Category'}
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            {/* Edit Category - HeroUI Modal */}
            <Modal 
              isOpen={!!editing} 
              onClose={() => !saving && setEditing(null)}
              size="md"
              backdrop="blur"
            >
              <ModalContent>
                <ModalHeader>
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-[#003366] dark:text-[#4A90E2]" />
                    <span>Edit Category</span>
                  </div>
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
                <ModalFooter>
                  <Button variant="light" onPress={() => !saving && setEditing(null)} isDisabled={saving}>Cancel</Button>
                  <Button
                    color="primary"
                    isLoading={saving}
                    isDisabled={saving || !editing?.name.trim()}
                    startContent={!saving && <CheckCircle className="w-4 h-4" />}
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
                        showNotification('Category updated successfully!', 'success');
                        setEditing(null);
                        mutate();
                      } catch (_) {
                        showNotification('Failed to update category', 'error');
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    {saving ? 'Updating Category...' : 'Update Category'}
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            {/* Delete Category - HeroUI Modal */}
            <Modal 
              isOpen={!!deleting} 
              onClose={() => !saving && setDeleting(null)}
              size="md"
              backdrop="blur"
            >
              <ModalContent>
                <ModalHeader>
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-red-500" />
                    <span>Delete Category</span>
                  </div>
                </ModalHeader>

                <ModalBody>
                  <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <CardBody className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-800 dark:text-red-200 text-sm">Warning: This action is permanent</h4>
                          <p className="text-red-700 dark:text-red-300 text-sm mt-1">You are about to permanently delete this category and all its data.</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Tag className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">{deleting?.name}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                    </div>
                  </div>
                </ModalBody>

                <ModalFooter>
                  <Button variant="light" onPress={() => !saving && setDeleting(null)} isDisabled={saving}>Cancel</Button>
                  <Button
                    color="danger"
                    onPress={async () => {
                      if (!deleting) return;
                      setSaving(true);
                      try {
                        const res = await fetch(`/api/category?id=${deleting.id}`, { method: 'DELETE' });
                        if (!res.ok) throw new Error('Failed to delete');
                        showNotification('Category deleted successfully!', 'success');
                        setDeleting(null);
                        mutate();
                      } catch (_) {
                        showNotification('Failed to delete category', 'error');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    isLoading={saving}
                    startContent={!saving && <Trash2 className="w-4 h-4" />}
                  >
                    {saving ? 'Deleting...' : 'Delete Category'}
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
        </div>
    );
};

export default Category;