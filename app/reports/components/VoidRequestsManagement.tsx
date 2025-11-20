"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea } from "@heroui/react";
import { AlertTriangle, Check, X, Clock, User, Calendar, FileText } from "lucide-react";

export default function VoidRequestsManagement() {
  const [voidRequests, setVoidRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  useEffect(() => {
    fetchVoidRequests(true);
  }, [filter]);

  // Real-time updates
  useEffect(() => {
    // Poll every 5 seconds for new void requests
    const interval = setInterval(() => {
      fetchVoidRequests(false);
    }, 5000);

    // Listen for void request created event
    const handleVoidRequestCreated = () => {
      fetchVoidRequests(false);
    };
    window.addEventListener('voidRequestCreated', handleVoidRequestCreated);

    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchVoidRequests(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Refresh when window gains focus
    const handleFocus = () => {
      fetchVoidRequests(false);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('voidRequestCreated', handleVoidRequestCreated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [filter]);

  const fetchVoidRequests = async (showLoading: boolean = false) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      const url = filter === "all" 
        ? "/api/void-requests" 
        : `/api/void-requests?status=${filter}`;
      
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setVoidRequests(data);
      }
    } catch (error) {
      console.error("Error fetching void requests:", error);
    } finally {
      if (showLoading) {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    }
  };

  const handleApproveClick = (requestId: string) => {
    setPendingRequestId(requestId);
    setConfirmAction("approve");
    setIsConfirmModalOpen(true);
  };

  const handleRejectClick = (requestId: string) => {
    setPendingRequestId(requestId);
    setConfirmAction("reject");
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!pendingRequestId || !confirmAction) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/void-requests/${pendingRequestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: confirmAction }),
      });

      if (response.ok) {
        fetchVoidRequests(false);
        setIsDetailModalOpen(false);
        setIsConfirmModalOpen(false);
        setPendingRequestId(null);
        setConfirmAction(null);
        
        // Trigger custom event to notify sidebar to refresh void request count
        window.dispatchEvent(new CustomEvent('voidRequestUpdated'));
      } else {
        const data = await response.json();
        alert(data.error || `Failed to ${confirmAction} request`);
      }
    } catch (error) {
      console.error(`Error ${confirmAction}ing void request:`, error);
      alert(`Failed to ${confirmAction} request`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "approved":
        return <Check className="h-4 w-4" />;
      case "rejected":
        return <X className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (isLoading && isInitialLoad) {
    return <div className="text-center py-8">Loading void requests...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={filter === "pending" ? "solid" : "flat"}
            color="warning"
            onPress={() => setFilter("pending")}
          >
            Pending
          </Button>
          <Button
            size="sm"
            variant={filter === "approved" ? "solid" : "flat"}
            color="success"
            onPress={() => setFilter("approved")}
          >
            Approved
          </Button>
          <Button
            size="sm"
            variant={filter === "rejected" ? "solid" : "flat"}
            color="danger"
            onPress={() => setFilter("rejected")}
          >
            Rejected
          </Button>
          <Button
            size="sm"
            variant={filter === "all" ? "solid" : "flat"}
            onPress={() => setFilter("all")}
          >
            All
          </Button>
        </div>
      </div>

      {/* Requests List */}
      {voidRequests.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No void requests found</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {voidRequests.map((request) => (
            <Card key={request.id} className="border border-gray-200 dark:border-gray-700">
              <CardBody className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Chip
                        size="sm"
                        variant="flat"
                        color={getStatusColor(request.status)}
                        startContent={getStatusIcon(request.status)}
                      >
                        {request.status.toUpperCase()}
                      </Chip>
                      <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                        {request.transactionNo}
                      </span>
                      {(() => {
                        try {
                          const txData = JSON.parse(request.transactionData);
                          if (txData.totalAmount) {
                            return (
                              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                ₱{txData.totalAmount.toFixed(2)}
                              </span>
                            );
                          }
                        } catch (error) {
                          // Ignore parse errors
                        }
                        return null;
                      })()}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Requested by: <span className="font-medium text-gray-900 dark:text-gray-100">{request.requestedByEmail}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {new Date(request.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {request.approvedByEmail && (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            By: <span className="font-medium text-gray-900 dark:text-gray-100">{request.approvedByEmail}</span>
                          </span>
                        </div>
                      )}
                    </div>
                    {request.reason && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 italic">
                        Reason: {request.reason}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => {
                        setSelectedRequest(request);
                        setIsDetailModalOpen(true);
                      }}
                      startContent={<FileText className="h-4 w-4" />}
                    >
                      View Details
                    </Button>
                    {request.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          color="success"
                          variant="flat"
                          onPress={() => handleApproveClick(request.id)}
                          isDisabled={isProcessing}
                          startContent={<Check className="h-4 w-4" />}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          onPress={() => handleRejectClick(request.id)}
                          isDisabled={isProcessing}
                          startContent={<X className="h-4 w-4" />}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} size="2xl">
        <ModalContent>
          <ModalHeader>Void Request Details</ModalHeader>
          <ModalBody>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Transaction Number</div>
                    <div className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                      {selectedRequest.transactionNo}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={getStatusColor(selectedRequest.status)}
                      startContent={getStatusIcon(selectedRequest.status)}
                    >
                      {selectedRequest.status.toUpperCase()}
                    </Chip>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Requested By</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {selectedRequest.requestedByEmail}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Requested At</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(selectedRequest.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {selectedRequest.approvedByEmail && (
                    <>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Approved/Rejected By</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {selectedRequest.approvedByEmail}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Decision At</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(selectedRequest.approvedAt).toLocaleString()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {selectedRequest.reason && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reason</div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100">
                      {selectedRequest.reason}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Transaction Details</div>
                  {(() => {
                    try {
                      const txData = JSON.parse(selectedRequest.transactionData);
                      return (
                        <div className="space-y-3">
                          {/* Transaction Summary */}
                          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Amount</span>
                              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                ₱{txData.totalAmount?.toFixed(2) || "0.00"}
                              </span>
                            </div>
                            {txData.receiptData && (
                              <>
                                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  {txData.receiptData.subtotal && (
                                    <div className="flex justify-between">
                                      <span>Subtotal:</span>
                                      <span>₱{txData.receiptData.subtotal.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {txData.receiptData.discount > 0 && (
                                    <div className="flex justify-between">
                                      <span>Discount:</span>
                                      <span>-₱{txData.receiptData.discount.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {txData.receiptData.amountReceived && (
                                    <>
                                      <div className="flex justify-between">
                                        <span>Amount Received:</span>
                                        <span>₱{txData.receiptData.amountReceived.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Change:</span>
                                        <span>₱{txData.receiptData.change?.toFixed(2) || "0.00"}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Products List */}
                          {txData.receiptData?.items && txData.receiptData.items.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Products ({txData.receiptData.items.length})
                              </div>
                              <div className="space-y-2">
                                {txData.receiptData.items.map((item: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                          {item.name}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                          ₱{item.price} × {item.quantity}
                                        </div>
                                      </div>
                                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        ₱{(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    } catch (error) {
                      return (
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
                          Unable to parse transaction data
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {selectedRequest?.status === "pending" ? (
              <>
                <Button variant="light" onPress={() => setIsDetailModalOpen(false)} isDisabled={isProcessing}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={() => handleRejectClick(selectedRequest.id)}
                  isLoading={isProcessing}
                  startContent={<X className="h-4 w-4" />}
                >
                  Reject
                </Button>
                <Button
                  color="success"
                  onPress={() => handleApproveClick(selectedRequest.id)}
                  isLoading={isProcessing}
                  startContent={<Check className="h-4 w-4" />}
                >
                  Approve & Void
                </Button>
              </>
            ) : (
              <Button onPress={() => setIsDetailModalOpen(false)}>Close</Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmModalOpen} onClose={() => !isProcessing && setIsConfirmModalOpen(false)} size="md">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">
              {confirmAction === "approve" ? "Approve Void Request" : "Reject Void Request"}
            </h3>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {confirmAction === "approve" 
                ? "Are you sure you want to approve this void request? This will void the transaction and restore the stock."
                : "Are you sure you want to reject this void request? The transaction will remain active."
              }
            </p>
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="light" 
              onPress={() => setIsConfirmModalOpen(false)}
              isDisabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              color={confirmAction === "approve" ? "success" : "danger"}
              onPress={handleConfirmAction}
              isLoading={isProcessing}
              startContent={confirmAction === "approve" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            >
              {isProcessing 
                ? (confirmAction === "approve" ? "Approving..." : "Rejecting...")
                : (confirmAction === "approve" ? "Approve & Void" : "Reject Request")
              }
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

