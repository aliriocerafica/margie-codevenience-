"use client";

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Progress,
  Chip
} from '@heroui/react';
import {
  Package,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded?: (product: any) => void;
}

interface Category {
  id: string;
  name: string;
  productCount?: number;
}

interface ProductFormData {
  name: string;
  price: string;
  stock: string;
  barcode: string;
  categoryId: string;
  image: string;
}

export default function AddProductModal({ isOpen, onClose, onProductAdded }: AddProductModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: '',
    stock: '',
    barcode: '',
    categoryId: '',
    image: ''
  });

  // Fetch categories on modal open
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Handle paste events
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (!isOpen) return;
      
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) {
            handleImageFile(file, 'paste');
          }
          break;
        }
      }
    };

    if (isOpen) {
      document.addEventListener('paste', handlePaste);
      return () => {
        document.removeEventListener('paste', handlePaste);
      };
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch('/api/category');
      if (response.ok) {
        const data = await response.json();
        console.log('Categories loaded:', data);
        setCategories(data);
      } else {
        console.error('Failed to fetch categories:', response.status);
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

      // Simulate progress
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

      // Show success notification
      showNotification({
        title: "Image Uploaded Successfully!",
        description: "Your product image has been uploaded and is ready to submit.",
        type: "success"
      });
    } catch (error) {
      console.error("Upload error:", error);
      showNotification({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
        type: "error"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleImageFile = (file: File, source: 'paste' | 'drag' | 'click' = 'click') => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotification({
        title: "Invalid File Type",
        description: "Please select an image file.",
        type: "error"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showNotification({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        type: "error"
      });
      return;
    }

    // Show feedback for paste
    if (source === 'paste') {
      showNotification({
        title: "Image Pasted!",
        description: "Processing your pasted image...",
        type: "success"
      });
    }

    setSelectedFile(file);
    handleImageUpload(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageFile(file, 'click');
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleImageFile(files[0], 'drag');
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    setPreviewImage('');
    setSelectedFile(null);
  };

  const showNotification = ({ title, description, type }: { title: string; description: string; type: 'success' | 'error' }) => {
    // Create a simple notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${type === 'success'
      ? 'bg-green-50 border border-green-200 text-green-800'
      : 'bg-red-50 border border-red-200 text-red-800'
      }`;

    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          ${type === 'success'
        ? '<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
        : '<svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'
      }
        </div>
        <div class="flex-1">
          <h4 class="font-semibold text-sm">${title}</h4>
          <p class="text-sm mt-1">${description}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      // Prepare product data
      const productData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price.trim()).toString(),
        stock: formData.stock.trim(),
        barcode: formData.barcode.trim() || 'na',
        categoryId: formData.categoryId,
        imageUrl: formData.image || null,
        status: 'available'
      };

      // Create product
      console.log('Sending product data:', productData);

      const productResponse = await fetch('/api/product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      console.log('Product response status:', productResponse.status);
      console.log('Product response ok:', productResponse.ok);

      if (!productResponse.ok) {
        const errorData = await productResponse.json();
        console.error('Product creation error:', errorData);
        throw new Error(errorData.error || 'Failed to create product');
      }

      const result = await productResponse.json();

      showNotification({
        title: "Product Created Successfully!",
        description: `${formData.name} has been added to your inventory.`,
        type: "success"
      });

      // Reset form
      setFormData({
        name: '',
        price: '',
        stock: '',
        barcode: '',
        categoryId: '',
        image: ''
      });
      setPreviewImage('');
      setSelectedFile(null);
      setErrors({});

      // Call callback if provided
      if (onProductAdded) {
        onProductAdded(result.product);
      }

      onClose();

    } catch (error) {
      console.error('Error creating product:', error);
      showNotification({
        title: "Failed to Create Product",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving && !uploading) {
      setFormData({
        name: '',
        price: '',
        stock: '',
        barcode: '',
        categoryId: '',
        image: ''
      });
      setPreviewImage('');
      setSelectedFile(null);
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      backdrop="blur"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "border-none",
        header: "border-b border-gray-200 dark:border-gray-700",
        footer: "border-t border-gray-200 dark:border-gray-700",
        closeButton: "hover:bg-gray-100 dark:hover:bg-gray-800",
      }}
      onOpenChange={(open) => {
        if (open) {
          // Focus the modal when it opens to ensure paste events work
          setTimeout(() => {
            const modal = document.querySelector('[role="dialog"]');
            if (modal) {
              (modal as HTMLElement).focus();
            }
          }, 100);
        }
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#003366] dark:text-[#4A90E2]" />
            <span className="text-lg font-semibold">Add New Product</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
            Create a new product and add it to your inventory
          </p>
        </ModalHeader>

        <ModalBody className="py-6">
          <div className="space-y-6">
            {/* Product Image Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Product Image
              </label>

              {previewImage ? (
                <div className="relative">
                  <img
                    src={previewImage}
                    alt="Product preview"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver 
                      ? 'border-[#003366] dark:border-[#4A90E2] bg-blue-50 dark:bg-blue-950/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-[#003366] dark:hover:border-[#4A90E2]'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="image-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`cursor-pointer flex flex-col items-center gap-2 ${uploading ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-8 h-8 text-[#003366] dark:text-[#4A90E2] animate-spin" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
                        <Progress
                          value={uploadProgress}
                          className="w-full max-w-xs"
                          color="primary"
                        />
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {isDragOver ? 'Drop image here' : 'Click to upload, drag & drop, or paste image'}
                        </span>
                        <span className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</span>
                        <div className="mt-2 flex items-center justify-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            📁 Click to browse
                          </span>
                          <span className="flex items-center gap-1">
                            🖱️ Drag & drop
                          </span>
                          <span className="flex items-center gap-1">
                            📋 <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+V</kbd> to paste
                          </span>
                        </div>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Product Name *
                </label>
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Price *
                </label>
                <Input
                  value={formData.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow numbers, decimal point, and up to 2 decimal places
                    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                      setFormData(prev => ({ ...prev, price: value }));
                    }
                  }}
                  placeholder="0.00"
                  size="lg"
                  type="text"
                  min="0"
                  isInvalid={!!errors.price}
                  errorMessage={errors.price}
                  classNames={{
                    input: "text-sm py-3 px-3",
                    inputWrapper: "h-12 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700"
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Stock Quantity *
                </label>
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Barcode (Optional)
                </label>
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Category *
              </label>
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

        <ModalFooter className="justify-end gap-2">
          <Button
            variant="light"
            onPress={handleClose}
            isDisabled={saving || uploading}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={saving}
            isDisabled={uploading}
            startContent={!saving && <CheckCircle className="w-4 h-4" />}
          >
            {saving ? 'Creating Product...' : 'Create Product'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
