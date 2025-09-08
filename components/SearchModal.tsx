"use client";

import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Spinner,
  Card,
  CardBody,
  Chip,
} from '@heroui/react';
import { Search, Package, Tag, Home, User, ShoppingCart } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';

const typeIcons = {
  page: Home,
  product: Package,
  category: Tag,
  user: User,
  order: ShoppingCart,
};

const typeColors = {
  page: 'primary',
  product: 'success',
  category: 'warning',
  user: 'secondary',
  order: 'danger',
} as const;

// Function to highlight matching text
const highlightText = (text: string, query: string) => {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

export default function SearchModal() {
  const {
    searchQuery,
    searchResults,
    isSearching,
    isSearchModalOpen,
    setSearchQuery,
    closeSearchModal,
    navigateToResult,
  } = useSearch();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeSearchModal();
    }
  };

  return (
    <Modal
      isOpen={isSearchModalOpen}
      onClose={closeSearchModal}
      size="2xl"
      scrollBehavior="inside"
      placement="top"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "border border-gray-200 dark:border-gray-700 mt-16",
        header: "border-b border-gray-200 dark:border-gray-700",
        body: "py-0",
        closeButton: "hover:bg-gray-100 dark:hover:bg-gray-800",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 pb-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-500" />
                <span className="text-lg font-semibold">Search</span>
              </div>
              <Input
                placeholder="Search products, categories, pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                classNames={{
                  base: "w-full",
                  input: "text-base",
                  inputWrapper: "shadow-none border-0 bg-gray-50 dark:bg-gray-800",
                }}
                startContent={<Search className="h-4 w-4 text-gray-400" />}
                autoFocus
              />
            </ModalHeader>
            <ModalBody className="py-4">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : searchQuery.trim() === '' ? (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Start typing to search</p>
                  <p className="text-sm">Search for products, categories, pages, and more</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No results found</p>
                  <p className="text-sm">Try searching with different keywords</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </p>
                  {searchResults.map((item) => {
                    const Icon = typeIcons[item.type];
                    return (
                      <Card
                        key={item.id}
                        isPressable
                        onPress={() => navigateToResult(item)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
                      >
                        <CardBody className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium text-gray-900 dark:text-white">
                                    {highlightText(item.title, searchQuery)}
                                  </h3>
                                  <Chip
                                    size="sm"
                                    color={typeColors[item.type]}
                                    variant="flat"
                                    className="text-xs"
                                  >
                                    {item.type}
                                  </Chip>
                                </div>
                                {item.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {highlightText(item.description, searchQuery)}
                                  </p>
                                )}
                                {item.metadata && (
                                  <div className="flex gap-2 mt-2">
                                    {item.metadata.price && (
                                      <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                        {highlightText(item.metadata.price, searchQuery)}
                                      </span>
                                    )}
                                    {item.metadata.category && (
                                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                        {highlightText(item.metadata.category, searchQuery)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ModalBody>
            <ModalFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="w-full flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <div className="flex gap-4">
                  <span>↑↓ to navigate</span>
                  <span>⏎ to select</span>
                  <span>esc to close</span>
                </div>
                <span>Global Search</span>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
