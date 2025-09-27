"use client";

import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Card, CardBody } from '@heroui/react';
import { Trash2, AlertTriangle, Image as ImageIcon } from 'lucide-react';

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: { id: string; name: string; imageUrl?: string } | null;
  onProductDeleted?: (productId: string) => void;
}

export default function DeleteProductModal({ isOpen, onClose, product, onProductDeleted }: DeleteProductModalProps) {
  const [deleting, setDeleting] = useState(false);

  const showNotification = (title: string, type: 'success' | 'error') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
      type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
    }`;
    notification.innerHTML = `<div class="flex items-center gap-2"><span class="font-semibold">${title}</span></div>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
  };

  const handleDelete = async () => {
    if (!product) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/product/${product.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete product');
      showNotification('Product deleted successfully!', 'success');
      onProductDeleted?.(product.id);
      onClose();
    } catch (error) {
      showNotification('Failed to delete product', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={() => !deleting && onClose()} size="md" backdrop="blur">
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            <span>Delete Product</span>
          </div>
        </ModalHeader>

        <ModalBody>
          <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <CardBody className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-200 text-sm">Warning: This action is permanent</h4>
                  <p className="text-red-700 dark:text-red-300 text-sm mt-1">You are about to permanently delete this product and all its data.</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
            ) : (
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
            )}
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white">{product.name}</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">ID: {product.id}</p>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={() => !deleting && onClose()} isDisabled={deleting}>Cancel</Button>
          <Button color="danger" onPress={handleDelete} isLoading={deleting} startContent={!deleting && <Trash2 className="w-4 h-4" />}>
            {deleting ? 'Deleting...' : 'Delete Product'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
