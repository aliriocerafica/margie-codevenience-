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
  Chip,
  Tabs,
  Tab
} from '@heroui/react';
import {
  Package,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  Info,
  DollarSign,
  Tag
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded?: (product: any) => void;
  initialData?: Partial<ProductFormData>;
}

interface Category {
  id: string;
  name: string;
  productCount?: number;
}

interface ProductFormData {
  name: string;
  brand: string;
  product: string;
  quantity: string;
  size: string;
  price: string;
  unitCost: string;
  stock: string;
  barcode: string;
  categoryId: string;
  image: string;
}

export default function AddProductModal({ isOpen, onClose, onProductAdded, initialData }: AddProductModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { refreshNotifications, addNewProductNotification } = useNotifications();
  const [isDragOver, setIsDragOver] = useState(false);
  const [restorationData, setRestorationData] = useState<{
    restoreId: string;
    restoreName: string;
    restoreBarcode: string;
    canRestore: boolean;
  } | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    brand: '',
    product: '',
    quantity: '',
    size: '',
    price: '',
    unitCost: '',
    stock: '',
    barcode: '',
    categoryId: '',
    image: ''
  });

  // Prefill from initialData when opening
  useEffect(() => {
    if (!isOpen) return;
    if (!initialData) return;
    setFormData(prev => ({
      name: initialData.name ?? prev.name,
      brand: initialData.brand ?? prev.brand,
      product: initialData.product ?? prev.product,
      quantity: initialData.quantity ?? prev.quantity,
      size: initialData.size ?? prev.size,
      price: initialData.price ?? prev.price,
      unitCost: initialData.unitCost ?? prev.unitCost,
      stock: initialData.stock ?? prev.stock,
      barcode: initialData.barcode ?? prev.barcode,
      categoryId: initialData.categoryId ?? prev.categoryId,
      image: initialData.image ?? prev.image,
    }));
    if (initialData.image) setPreviewImage(initialData.image);
  }, [isOpen, initialData]);

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
      newErrors.price = 'Selling price is required';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Selling price must be a valid positive number';
    }

    if (formData.unitCost && (isNaN(Number(formData.unitCost)) || Number(formData.unitCost) < 0)) {
      newErrors.unitCost = 'Unit cost must be a valid non-negative number';
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

  const handleRestore = async () => {
    if (!restorationData) return;
    
    setSaving(true);
    
    try {
      const restoreData = {
        id: restorationData.restoreId,
        name: formData.name.trim(),
        price: parseFloat(formData.price.trim()).toString(),
        stock: formData.stock.trim(),
        barcode: formData.barcode.trim() || null,
        categoryId: formData.categoryId,
        imageUrl: formData.image || null
      };

      const restoreResponse = await fetch('/api/product/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restoreData),
      });

      if (!restoreResponse.ok) {
        const errorData = await restoreResponse.json();
        throw new Error(errorData.details || errorData.error || 'Failed to restore product');
      }

      const result = await restoreResponse.json();

      showNotification({
        title: "Product Restored Successfully!",
        description: `${formData.name} has been restored to your inventory.`,
        type: "success"
      });

      // Reset form and restoration data
      setFormData({
        name: '',
        brand: '',
        product: '',
        quantity: '',
        size: '',
        price: '',
        unitCost: '',
        stock: '',
        barcode: '',
        categoryId: '',
        image: ''
      });
      setPreviewImage('');
      setSelectedFile(null);
      setErrors({});
      setRestorationData(null);

      // Call callback if provided
      if (onProductAdded) {
        onProductAdded(result.product);
      }

      // Add restoration notification and refresh stock alerts
      try {
        await addNewProductNotification(result.product.name, result.product.id, true); // true = isRestoration
        // Force refresh notifications to ensure they're updated
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        await refreshNotifications();
      } catch (notificationError) {
        console.error('Error adding notification:', notificationError);
      }

      onClose();
    } catch (error) {
      console.error('Restoration error:', error);
      showNotification({
        title: "Restoration Failed",
        description: error instanceof Error ? error.message : 'Failed to restore product',
        type: "error"
      });
    } finally {
      setSaving(false);
    }
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
        brand: formData.brand.trim() || null,
        product: formData.product.trim() || null,
        quantity: formData.quantity.trim() || null,
        size: formData.size.trim() || null,
        price: parseFloat(formData.price.trim()).toString(),
        unitCost: formData.unitCost.trim() ? parseFloat(formData.unitCost.trim()).toString() : null,
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


      if (!productResponse.ok) {
        const errorData = await productResponse.json();
        
        // Check if this is a restoration opportunity
        if (errorData.canRestore && errorData.restoreId) {
          setRestorationData({
            restoreId: errorData.restoreId,
            restoreName: errorData.restoreName,
            restoreBarcode: errorData.restoreBarcode,
            canRestore: errorData.canRestore
          });
          return; // Don't throw error, show restoration option
        }
        
        throw new Error(errorData.details || errorData.error || 'Failed to create product');
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
        brand: '',
        product: '',
        quantity: '',
        size: '',
        price: '',
        unitCost: '',
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

      // Add new product notification and refresh stock alerts
      addNewProductNotification(result.product.name, result.product.id);
      try { await refreshNotifications(); } catch {}

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
        brand: '',
        product: '',
        quantity: '',
        size: '',
        price: '',
        unitCost: '',
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
      size="3xl"
      backdrop="blur"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "border-none max-h-[90vh]",
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

        <ModalBody className="py-4">
          <Tabs 
            aria-label="Product form tabs" 
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-[#003366] dark:bg-[#4A90E2]",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-[#003366] dark:group-data-[selected=true]:text-[#4A90E2]"
            }}
          >
            <Tab 
              key="basic" 
              title={
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4" />
                  <span>Basic Info</span>
                </div>
              }
            >
              <div className="space-y-4 pt-4">
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
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
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
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
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
                            <Loader2 className="w-6 h-6 text-[#003366] dark:text-[#4A90E2] animate-spin" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
                            <Progress
                              value={uploadProgress}
                              className="w-full max-w-xs"
                              color="primary"
                            />
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {isDragOver ? 'Drop image here' : 'Click to upload, drag & drop, or paste image'}
                            </span>
                            <span className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>

                {/* Basic Product Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Product Name *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter product name"
                      size="md"
                      isInvalid={!!errors.name}
                      errorMessage={errors.name}
                      classNames={{
                        input: "text-sm",
                        inputWrapper: "h-10 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-lg transition-all duration-200"
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Brand
                    </label>
                    <Input
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="e.g., Lucky Me, Mega"
                      size="md"
                      classNames={{
                        input: "text-sm",
                        inputWrapper: "h-10 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-lg transition-all duration-200"
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Product Type
                    </label>
                    <Input
                      value={formData.product}
                      onChange={(e) => setFormData(prev => ({ ...prev, product: e.target.value }))}
                      placeholder="e.g., Pancit Canton, Sardines"
                      size="md"
                      classNames={{
                        input: "text-sm",
                        inputWrapper: "h-10 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-lg transition-all duration-200"
                      }}
                    />
                  </div>

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
                      size="md"
                      isInvalid={!!errors.categoryId}
                      errorMessage={errors.categoryId}
                      isLoading={loadingCategories}
                      classNames={{
                        trigger: "h-10 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-lg transition-all duration-200",
                        value: "text-sm"
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
              </div>
            </Tab>

            <Tab 
              key="details" 
              title={
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4" />
                  <span>Details</span>
                </div>
              }
            >
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Quantity (Packaging)
                    </label>
                    <Input
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="e.g., 1 pc, 1 can, 1 pack"
                      size="md"
                      classNames={{
                        input: "text-sm",
                        inputWrapper: "h-10 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-lg transition-all duration-200"
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Size/Weight
                    </label>
                    <Input
                      value={formData.size}
                      onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                      placeholder="e.g., 150g, 1L, 4.6 oz"
                      size="md"
                      classNames={{
                        input: "text-sm",
                        inputWrapper: "h-10 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-lg transition-all duration-200"
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
                      size="md"
                      classNames={{
                        input: "text-sm",
                        inputWrapper: "h-10 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-lg transition-all duration-200"
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
                      size="md"
                      type="number"
                      min="0"
                      isInvalid={!!errors.stock}
                      errorMessage={errors.stock}
                      classNames={{
                        input: "text-sm",
                        inputWrapper: "h-10 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-lg transition-all duration-200"
                      }}
                    />
                  </div>
                </div>
              </div>
            </Tab>

            <Tab 
              key="pricing" 
              title={
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Pricing</span>
                </div>
              }
            >
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Unit Cost (Original Price)
                    </label>
                    <Input
                      value={formData.unitCost}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow numbers, decimal point, and up to 2 decimal places
                        if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                          setFormData(prev => ({ ...prev, unitCost: value }));
                        }
                      }}
                      placeholder="0.00"
                      size="md"
                      type="text"
                      min="0"
                      isInvalid={!!errors.unitCost}
                      errorMessage={errors.unitCost}
                      classNames={{
                        input: "text-sm",
                        inputWrapper: "h-10 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-lg transition-all duration-200"
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Selling Price (Retail Price) *
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
                      size="md"
                      type="text"
                      min="0"
                      isInvalid={!!errors.price}
                      errorMessage={errors.price}
                      classNames={{
                        input: "text-sm",
                        inputWrapper: "h-10 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-lg transition-all duration-200"
                      }}
                    />
                  </div>
                </div>

                {/* Profit Margin Display */}
                {formData.unitCost && formData.price && !isNaN(Number(formData.unitCost)) && !isNaN(Number(formData.price)) && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-blue-800 dark:text-blue-200">Profit Margin:</span>
                      <span className="text-blue-700 dark:text-blue-300">
                        ₱{(Number(formData.price) - Number(formData.unitCost)).toFixed(2)} 
                        ({(((Number(formData.price) - Number(formData.unitCost)) / Number(formData.price)) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </ModalBody>

        {/* Restoration Alert */}
        {restorationData && (
          <div className="mx-6 mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Product Restoration Available
                </h3>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  A deleted product with barcode "{restorationData.restoreBarcode}" exists ({restorationData.restoreName}). 
                  Would you like to restore it instead of creating a new one?
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    color="warning"
                    variant="flat"
                    onPress={handleRestore}
                    isLoading={saving}
                    startContent={!saving && <CheckCircle className="w-4 h-4" />}
                  >
                    {saving ? 'Restoring...' : 'Restore Product'}
                  </Button>
                  <Button
                    size="sm"
                    variant="light"
                    onPress={() => setRestorationData(null)}
                    isDisabled={saving}
                  >
                    Create New Instead
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

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
            isDisabled={uploading || restorationData !== null}
            startContent={!saving && <CheckCircle className="w-4 h-4" />}
          >
            {saving ? 'Creating Product...' : 'Create Product'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
