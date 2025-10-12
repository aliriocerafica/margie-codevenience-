"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { Button, Input, Popover, PopoverTrigger, PopoverContent, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem, Switch } from "@heroui/react";
import { Download, Calendar, BarChart3, TrendingUp, RotateCcw } from "lucide-react";
import DataTable from "@/components/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import SalesPerformanceCard from "./components/SalesPerformanceCard";
import TopProductsCard from "./components/TopProductsCard";
import RevenueTrendsCard from "./components/RevenueTrendsCard";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ReportsPage() {
  // Committed filter values (used for fetching)
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  // Draft values inside the popover (don't fetch until Apply)
  const [draftFrom, setDraftFrom] = useState<string>("");
  const [draftTo, setDraftTo] = useState<string>("");
  const [draftPreset, setDraftPreset] = useState<
    "custom" | "today" | "yesterday" | "last7" | "last30" | "thisMonth" | "lastMonth"
  >("custom");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Export modal state
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [exportFrom, setExportFrom] = useState<string>("");
  const [exportTo, setExportTo] = useState<string>("");
  const [exportFileType, setExportFileType] = useState<string>("csv");
  const [exportAll, setExportAll] = useState<boolean>(true);
  const [periodPreset, setPeriodPreset] = useState<
    "custom" | "today" | "yesterday" | "last7" | "last30" | "thisMonth" | "lastMonth"
  >("custom");

  const applyPresetRange = (preset: typeof periodPreset) => {
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

    let from: Date | null = null;
    let to: Date | null = null;

    switch (preset) {
      case "today": {
        from = startOfDay(now);
        to = endOfDay(now);
        break;
      }
      case "yesterday": {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        from = startOfDay(y);
        to = endOfDay(y);
        break;
      }
      case "last7": {
        const s = new Date(now);
        s.setDate(s.getDate() - 6);
        from = startOfDay(s);
        to = endOfDay(now);
        break;
      }
      case "last30": {
        const s = new Date(now);
        s.setDate(s.getDate() - 29);
        from = startOfDay(s);
        to = endOfDay(now);
        break;
      }
      case "thisMonth": {
        const s = new Date(now.getFullYear(), now.getMonth(), 1);
        const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        from = startOfDay(s);
        to = endOfDay(e);
        break;
      }
      case "lastMonth": {
        const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const e = new Date(now.getFullYear(), now.getMonth(), 0);
        from = startOfDay(s);
        to = endOfDay(e);
        break;
      }
      case "custom":
      default:
        from = null; to = null;
    }

    if (from && to) {
      const toLocalInput = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };
      setExportFrom(toLocalInput(from));
      setExportTo(toLocalInput(to));
    }
  };

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", "500");
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);
    return `/api/reports/stock-movements?${params.toString()}`;
  }, [dateFrom, dateTo, typeFilter]);

  const { data, error, isLoading } = useSWR(query, fetcher);

  const rawRows = data?.rows ?? [];
  // DataTable filters by `status`; map movement `type` into `status`
  const rows = useMemo(() => rawRows.map((r: any) => ({ ...r, status: r.type })), [rawRows]);
  const MOVEMENT_STATUS_OPTIONS = [
    { key: "all", label: "All Types" },
    { key: "sale", label: "Sale" },
    { key: "refund", label: "Refund" },
    { key: "manual", label: "Manual" },
    { key: "void", label: "Void" },
  ];

  const stats = useMemo(() => {
    const total = rows.length;
    const sale = rows.filter((r: any) => r.type === "sale").length;
    const refund = rows.filter((r: any) => r.type === "refund").length;
    const manual = rows.filter((r: any) => r.type === "manual").length;
    const voids = rows.filter((r: any) => r.type === "void").length;
    return { total, sale, refund, manual, voids };
  }, [rows]);

  const columns = [
    { key: "#", header: "#", sortable: false, renderCell: (_: any, i: number) => i },
    { key: "createdAt", header: "Date", sortable: true, renderCell: (r: any) => new Date(r.createdAt).toLocaleString() },
    { key: "product", header: "Product", sortable: true, renderCell: (r: any) => r.product?.name ?? "-" },
    { key: "type", header: "Type", sortable: true },
    { key: "quantity", header: "Qty", sortable: true },
    { key: "beforeStock", header: "Before", sortable: false },
    { key: "afterStock", header: "After", sortable: false },
    { key: "refId", header: "Ref", sortable: false },
    { key: "reason", header: "Reason", sortable: false },
  ];

  const toLocalInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const applyDraftPresetRange = (preset: typeof draftPreset) => {
    const now = new Date();
    const startOfDay = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0);
    const endOfDay = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 23, 59, 59);

    let from: Date | null = null;
    let to: Date | null = null;

    switch (preset) {
      case "today":
        from = startOfDay(now); to = endOfDay(now); break;
      case "yesterday": {
        const y = new Date(now); y.setDate(y.getDate() - 1);
        from = startOfDay(y); to = endOfDay(y); break;
      }
      case "last7": {
        const s = new Date(now); s.setDate(s.getDate() - 6);
        from = startOfDay(s); to = endOfDay(now); break;
      }
      case "last30": {
        const s = new Date(now); s.setDate(s.getDate() - 29);
        from = startOfDay(s); to = endOfDay(now); break;
      }
      case "thisMonth": {
        const s = new Date(now.getFullYear(), now.getMonth(), 1);
        const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        from = startOfDay(s); to = endOfDay(e); break;
      }
      case "lastMonth": {
        const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const e = new Date(now.getFullYear(), now.getMonth(), 0);
        from = startOfDay(s); to = endOfDay(e); break;
      }
      case "custom":
      default:
        from = null; to = null;
    }

    if (from && to) {
      setDraftFrom(toLocalInput(from));
      setDraftTo(toLocalInput(to));
    }
  };

  const performExport = () => {
    const withinRange = (createdAt: string | number | Date) => {
      if (exportAll) return true;
      const ts = new Date(createdAt).getTime();
      const fromOk = exportFrom ? ts >= new Date(exportFrom).getTime() : true;
      const toOk = exportTo ? ts <= new Date(exportTo).getTime() : true;
      return fromOk && toOk;
    };

    const filtered = rows.filter((r: any) => withinRange(r.createdAt));

    if (exportFileType === "csv") {
      const header = ["Date","Product","Type","Qty","Before","After","Ref","Reason"]; 
      const lines = filtered.map((r: any) => [
        new Date(r.createdAt).toISOString(),
        (r.product?.name ?? "").replaceAll(","," "),
        r.type,
        r.quantity,
        r.beforeStock,
        r.afterStock,
        r.refId ?? "",
        (r.reason ?? "").replaceAll(","," "),
      ].join(","));
      const csv = [header.join(","), ...lines].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "stock-movements.csv";
      a.click();
      URL.revokeObjectURL(url);
    } else if (exportFileType === "tsv") {
      const header = ["Date","Product","Type","Qty","Before","After","Ref","Reason"];
      const lines = filtered.map((r: any) => [
        new Date(r.createdAt).toISOString(),
        r.product?.name ?? "",
        r.type,
        r.quantity,
        r.beforeStock,
        r.afterStock,
        r.refId ?? "",
        r.reason ?? "",
      ].join("\t"));
      const tsv = [header.join("\t"), ...lines].join("\n");
      const blob = new Blob([tsv], { type: "text/tab-separated-values;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "stock-movements.tsv";
      a.click();
      URL.revokeObjectURL(url);
    } else if (exportFileType === "json") {
      const payload = filtered.map((r: any) => ({
        date: new Date(r.createdAt).toISOString(),
        product: r.product?.name ?? null,
        type: r.type,
        quantity: r.quantity,
        beforeStock: r.beforeStock,
        afterStock: r.afterStock,
        refId: r.refId ?? null,
        reason: r.reason ?? null,
      }));
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "stock-movements.json";
      a.click();
      URL.revokeObjectURL(url);
    } else if (exportFileType === "xml") {
      const escXml = (v: any) => String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
      const rowsXml = filtered.map((r: any) => (
        `  <movement>\n` +
        `    <date>${escXml(new Date(r.createdAt).toISOString())}</date>\n` +
        `    <product>${escXml(r.product?.name ?? "")}</product>\n` +
        `    <type>${escXml(r.type)}</type>\n` +
        `    <quantity>${escXml(r.quantity)}</quantity>\n` +
        `    <beforeStock>${escXml(r.beforeStock)}</beforeStock>\n` +
        `    <afterStock>${escXml(r.afterStock)}</afterStock>\n` +
        `    <refId>${escXml(r.refId ?? "")}</refId>\n` +
        `    <reason>${escXml(r.reason ?? "")}</reason>\n` +
        `  </movement>`
      )).join("\n");
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<stockMovements>\n${rowsXml}\n</stockMovements>\n`;
      const blob = new Blob([xml], { type: "application/xml;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "stock-movements.xml";
      a.click();
      URL.revokeObjectURL(url);
    }
    setIsExportOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Sales Reports" />

      <Modal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} size="xl">
        <ModalContent>
          <ModalHeader>Export Stock Movements</ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Select Export Period</p>
                <Switch isSelected={exportAll} onValueChange={setExportAll} className="mb-4">
                  Export all entries ({rows.length})
                </Switch>
                {!exportAll && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "today", label: "Today" },
                        { key: "yesterday", label: "Yesterday" },
                        { key: "last7", label: "Last 7 days" },
                        { key: "last30", label: "Last 30 days" },
                        { key: "thisMonth", label: "This month" },
                        { key: "lastMonth", label: "Last month" },
                        { key: "custom", label: "Custom range" },
                      ].map((p) => (
                        <Button
                          key={p.key}
                          size="sm"
                          variant={periodPreset === (p.key as any) ? "solid" : "flat"}
                          color={periodPreset === (p.key as any) ? "primary" : "default"}
                          onPress={() => { setPeriodPreset(p.key as any); if (p.key !== "custom") applyPresetRange(p.key as any); }}
                        >
                          {p.label}
                        </Button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="datetime-local"
                        label="From"
                        labelPlacement="outside"
                        value={exportFrom}
                        onChange={(e) => setExportFrom(e.target.value)}
                        isReadOnly={periodPreset !== "custom"}
                        size="lg"
                        classNames={{ inputWrapper: "h-12" }}
                      />
                      <Input
                        type="datetime-local"
                        label="To"
                        labelPlacement="outside"
                        value={exportTo}
                        onChange={(e) => setExportTo(e.target.value)}
                        isReadOnly={periodPreset !== "custom"}
                        size="lg"
                        classNames={{ inputWrapper: "h-12" }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Select File Format</p>
                <Select
                  selectedKeys={[exportFileType]}
                  onSelectionChange={(keys) => {
                    const [k] = Array.from(keys) as string[];
                    setExportFileType(k);
                  }}
                  label="File type"
                  labelPlacement="outside"
                  size="lg"
                >
                  <SelectItem key="csv">CSV (Comma-separated)</SelectItem>
                  <SelectItem key="tsv">TSV (Tab-separated)</SelectItem>
                  <SelectItem key="json">JSON</SelectItem>
                  <SelectItem key="xml">XML</SelectItem>
                </Select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsExportOpen(false)}>Cancel</Button>
            <Button color="primary" startContent={<Download className="h-4 w-4" />} onPress={performExport}>Export</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Movements" value={String(stats.total)} icon={BarChart3} color="blue" />
        <StatCard title="Sales Posted" value={String(stats.sale)} icon={TrendingUp} color="green" />
        <StatCard title="Refunds Posted" value={String(stats.refund)} icon={RotateCcw} color="yellow" />
        <StatCard title="Voids Posted" value={String(stats.voids)} icon={RotateCcw} color="red" />
      </div>

      {/* Sales Reports Feature Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SalesPerformanceCard />
        <TopProductsCard />
        <RevenueTrendsCard />
      </div>

      {/* Stock Movements DataTable */}
      <div className="py-6">
      <DataTable
        filter={true}
        statusOptions={MOVEMENT_STATUS_OPTIONS}
        filterKey="type"
        filterLabel="Filter Type"
        columns={columns as any}
        data={rows}
          label="Stock Movements"
          description="All inventory movements from sales, refunds, voids, and manual adjustments."
        isLoading={isLoading}
        customFilters={(
          <div className="flex items-center gap-4 focus-visible-ring">
            <Popover placement="bottom-end">
              <PopoverTrigger>
                <Button isIconOnly size="lg" color="primary" variant="flat" aria-label="Filter by date" className="flex-shrink-0">
                  <Calendar className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-4 w-[22rem]">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Filter by period</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Use a quick range or select Custom to pick dates.</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "today", label: "Today" },
                      { key: "yesterday", label: "Yesterday" },
                      { key: "last7", label: "Last 7 days" },
                      { key: "last30", label: "Last 30 days" },
                      { key: "thisMonth", label: "This month" },
                      { key: "lastMonth", label: "Last month" },
                      { key: "custom", label: "Custom" },
                    ].map((p) => (
                      <Button
                        key={p.key}
                        size="sm"
                        variant={draftPreset === (p.key as any) ? "solid" : "flat"}
                        color={draftPreset === (p.key as any) ? "primary" : "default"}
                        onPress={() => { setDraftPreset(p.key as any); if (p.key !== "custom") applyDraftPresetRange(p.key as any); }}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <Input 
                      type="datetime-local" 
                      label="Start"
                      labelPlacement="outside"
                      size="lg"
                      placeholder="Start date & time"
                      value={draftFrom}
                      onChange={(e) => setDraftFrom(e.target.value)} 
                      isReadOnly={draftPreset !== "custom"}
                      classNames={{ inputWrapper: "h-12" }}
                    />
                    <Input 
                      type="datetime-local" 
                      label="End"
                      labelPlacement="outside"
                      size="lg"
                      placeholder="End date & time"
                      value={draftTo}
                      onChange={(e) => setDraftTo(e.target.value)} 
                      isReadOnly={draftPreset !== "custom"}
                      classNames={{ inputWrapper: "h-12" }}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="light" onPress={() => { setDraftFrom(""); setDraftTo(""); setDateFrom(""); setDateTo(""); setDraftPreset("custom"); }}>Reset</Button>
                    <Button color="primary" onPress={() => { setDateFrom(draftFrom); setDateTo(draftTo); }}>Apply filters</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button size="lg" color="primary" variant="solid" startContent={<Download className="h-4 w-4" />} onPress={() => setIsExportOpen(true)}>
              Export
            </Button>
          </div>
        )}
      />
      </div>
    </div>
  );
}

