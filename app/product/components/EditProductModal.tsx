"use client";

import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Progress, Chip, Card, CardBody } from '@heroui/react';
import { Package, Upload, X, CheckCircle, Image as ImageIcon, Loader2, AlertTriangle } from 'lucide-react';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: string;
    stock: string;
    barcode?: string;
    categoryId: string;
    imageUrl?: string;
  } | null;
  onProductUpdated?: (product: any) => void;
}

interface Category {
  id: string;
  name: string;
  productCount?: number;
}

export default function EditProductModal({ isOpen, onClose, product, onProductUpdated }: EditProductModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [oldImageUrl, setOldImageUrl] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    barcode: '',
    categoryId: '',
    image: ''
  });

  // Initialize form data when product changes
  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        name: product.name || '',
        price: product.price || '',
        stock: product.stock || '',
        barcode: product.barcode || '',
        categoryId: product.categoryId || '',
        image: product.imageUrl || ''
      });
      setPreviewImage(product.imageUrl || '');
      setOldImageUrl(product.imageUrl || '');
    }
  }, [product, isOpen]);

  // Fetch categories on modal open
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch('/api/category');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Price must be a valid positive number';
    }

    if (!formData.stock.trim()) {
      newErrors.stock = 'Stock is required';
    } else if (isNaN(Number(formData.stock)) || Number(formData.stock) < 0) {
      newErrors.stock = 'Stock must be a valid non-negative number';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const filename = `POS/products/${file.name}`;

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const res = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) throw new Error("Failed to upload image");
      const data = await res.json();

      setFormData(prev => ({ ...prev, image: data.url }));
      setPreviewImage(data.url);
      showNotification('Image uploaded successfully!', 'success');
    } catch (error) {
      showNotification('Failed to upload image', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Please select an image smaller than 5MB', 'error');
        return;
      }
      setSelectedFile(file);
      handleImageUpload(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    setPreviewImage('');
    setSelectedFile(null);
  };

  const showNotification = (title: string, type: 'success' | 'error') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
      type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
    }`;
    notification.innerHTML = `<div class="flex items-center gap-2"><span class="font-semibold">${title}</span></div>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
  };

  const handleSubmit = async () => {
    if (!validateForm() || !product) return;

    setSaving(true);
    try {
      const productData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price.trim()).toString(),
        stock: formData.stock.trim(),
        barcode: formData.barcode.trim() || null,
        categoryId: formData.categoryId,
        imageUrl: formData.image || null,
        oldImageUrl: oldImageUrl // Include old image URL for deletion
      };

      const response = await fetch(`/api/product/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }

      showNotification('Product updated successfully!', 'success');
      onProductUpdated?.(await response.json());
      onClose();
    } catch (error) {
      showNotification('Failed to update product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving && !uploading) {
      onClose();
    }
  };

  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl" backdrop="blur">
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#003366] dark:text-[#4A90E2]" />
            <span>Edit Product</span>
          </div>
        </ModalHeader>

        <ModalBody className="py-6">
          <div className="space-y-6">
            {/* Product Image Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Product Image</label>
              
              {previewImage ? (
                <div className="relative">
                  <img src={previewImage} alt="Product preview" className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                  <button onClick={removeImage} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-[#003366] dark:hover:border-[#4A90E2] transition-colors">
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="image-upload" disabled={uploading} />
                  <label htmlFor="image-upload" className={`cursor-pointer flex flex-col items-center gap-2 ${uploading ? 'cursor-not-allowed opacity-50' : ''}`}>
                    {uploading ? (
                      <>
                        <Loader2 className="w-8 h-8 text-[#003366] dark:text-[#4A90E2] animate-spin" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
                        <Progress value={uploadProgress} className="w-full max-w-xs" color="primary" />
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Click to upload an image or drag and drop</span>
                        <span className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</span>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Product Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter product name"
                  size="lg"
                  isInvalid={!!errors.name}
                  errorMessage={errors.name}
                  classNames={{
                    input: "text-sm py-3 px-3",
                    inputWrapper: "h-12 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700"
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Price *</label>
                <Input
                  value={formData.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                      setFormData(prev => ({ ...prev, price: value }));
                    }
                  }}
                  placeholder="0.00"
                  size="lg"
                  type="text"
                  isInvalid={!!errors.price}
                  errorMessage={errors.price}
                  classNames={{
                    input: "text-sm py-3 px-3",
                    inputWrapper: "h-12 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700"
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Stock Quantity *</label>
                <Input
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="0"
                  size="lg"
                  type="number"
                  min="0"
                  isInvalid={!!errors.stock}
                  errorMessage={errors.stock}
                  classNames={{
                    input: "text-sm py-3 px-3",
                    inputWrapper: "h-12 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700"
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Barcode (Optional)</label>
                <Input
                  value={formData.barcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                  placeholder="Enter barcode"
                  size="lg"
                  classNames={{
                    input: "text-sm py-3 px-3",
                    inputWrapper: "h-12 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700"
                  }}
                />
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Category *</label>
              <Select
                placeholder="Select a category"
                selectedKeys={formData.categoryId ? [formData.categoryId] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setFormData(prev => ({ ...prev, categoryId: selectedKey || '' }));
                }}
                size="lg"
                isInvalid={!!errors.categoryId}
                errorMessage={errors.categoryId}
                isLoading={loadingCategories}
                classNames={{
                  trigger: "h-12 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700",
                  value: "text-sm py-3 px-3"
                }}
              >
                {categories.map((category) => (
                  <SelectItem key={category.id} textValue={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={handleClose} isDisabled={saving || uploading}>Cancel</Button>
          <Button color="primary" onPress={handleSubmit} isLoading={saving} isDisabled={uploading} startContent={!saving && <CheckCircle className="w-4 h-4" />}>
            {saving ? 'Updating Product...' : 'Update Product'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
