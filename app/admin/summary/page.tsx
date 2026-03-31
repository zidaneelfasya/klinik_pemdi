"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { UserProvider } from "@/app/context/user-context";
import { useSummaryData } from "@/hooks/useSummaryData";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Calendar, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Dynamically import components that might have SSR issues
const SummaryCards = dynamic(() => import("@/components/summary-cards").then(mod => ({ default: mod.SummaryCards })), {
  ssr: false,
  loading: () => <Skeleton className="h-[200px] w-full" />
});

const DetailedStatsCards = dynamic(() => import("@/components/summary-cards").then(mod => ({ default: mod.DetailedStatsCards })), {
  ssr: false,
  loading: () => <Skeleton className="h-[200px] w-full" />
});

const SummaryCharts = dynamic(() => import("@/components/summary-charts").then(mod => ({ default: mod.SummaryCharts })), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full" />
});

const MonthlyComparisonChart = dynamic(() => import("@/components/summary-charts").then(mod => ({ default: mod.MonthlyComparisonChart })), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full" />
});

const TopikDistributionChart = dynamic(() => import("@/components/topik-chart").then(mod => ({ default: mod.TopikDistributionChart })), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full" />
});

// Single Date Picker Component
function DatePickerPopup({ 
  value, 
  onChange, 
  disabled,
  placeholder = "Pilih Tanggal"
}: { 
  value: string | null; 
  onChange: (date: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Initialize month and year from value without timezone issues
  const getInitialMonth = () => {
    if (value) {
      const [year, month] = value.split('-').map(Number);
      return month - 1; // month is 0-indexed
    }
    return new Date().getMonth();
  };
  
  const getInitialYear = () => {
    if (value) {
      const [year] = value.split('-').map(Number);
      return year;
    }
    return new Date().getFullYear();
  };
  
  const [currentMonth, setCurrentMonth] = useState(getInitialMonth());
  const [currentYear, setCurrentYear] = useState(getInitialYear());
  const [prevValue, setPrevValue] = useState(value);

  // Update month and year when value changes (render phase state update)
  if (value !== prevValue) {
    setPrevValue(value);
    if (value) {
      const [year, month] = value.split('-').map(Number);
      setCurrentMonth(month - 1);
      setCurrentYear(year);
    }
  }

  // Parse date string to avoid timezone issues
  const selectedDate = value ? (() => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  })() : null;
  
  const displayValue = selectedDate 
    ? selectedDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : placeholder;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const handleDateSelect = (day: number) => {
    // Create date string in local timezone (YYYY-MM-DD)
    const year = currentYear;
    const month = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleYearSelect = (year: number) => {
    setCurrentYear(year);
  };

  const handleMonthSelect = (month: number) => {
    setCurrentMonth(month);
  };

  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full justify-start text-left font-normal",
          !value && "text-muted-foreground"
        )}
      >
        <Calendar className="mr-2 h-4 w-4" />
        {displayValue}
      </Button>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setIsOpen(false);
              setShowYearPicker(false);
              setShowMonthPicker(false);
            }}
          />
          <div className="absolute z-50 mt-1 w-[320px] rounded-md border bg-popover p-3 shadow-md">
            {/* Header with Year/Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                className="h-7 w-7"
                disabled={showYearPicker || showMonthPicker}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowMonthPicker(!showMonthPicker);
                    setShowYearPicker(false);
                  }}
                  className="font-semibold hover:bg-accent"
                  disabled={showYearPicker}
                >
                  {monthNames[currentMonth]}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowYearPicker(!showYearPicker);
                    setShowMonthPicker(false);
                  }}
                  className="font-semibold hover:bg-accent"
                  disabled={showMonthPicker}
                >
                  {currentYear}
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="h-7 w-7"
                disabled={showYearPicker || showMonthPicker}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Year Picker */}
            {showYearPicker && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                {years.map((year) => (
                  <Button
                    key={year}
                    type="button"
                    variant={currentYear === year ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      handleYearSelect(year);
                      setShowYearPicker(false);
                    }}
                    className="text-xs"
                  >
                    {year}
                  </Button>
                ))}
              </div>
            )}

            {/* Month Picker */}
            {showMonthPicker && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {monthNames.map((month, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant={currentMonth === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      handleMonthSelect(index);
                      setShowMonthPicker(false);
                    }}
                    className="text-xs"
                  >
                    {month}
                  </Button>
                ))}
              </div>
            )}

            {/* Calendar Grid */}
            {!showYearPicker && !showMonthPicker && (
              <>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["M", "S", "S", "R", "K", "J", "S"].map((day, i) => (
                    <div key={i} className="text-center text-xs font-medium text-muted-foreground p-1">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {emptyDays.map((_, i) => (
                    <div key={`empty-${i}`} className="p-1" />
                  ))}
                  {days.map((day) => {
                    const date = new Date(currentYear, currentMonth, day);
                    const isSelected = selectedDate &&
                      selectedDate.getDate() === day &&
                      selectedDate.getMonth() === currentMonth &&
                      selectedDate.getFullYear() === currentYear;
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return (
                      <Button
                        key={day}
                        type="button"
                        variant={isSelected ? "default" : "ghost"}
                        size="icon"
                        onClick={() => handleDateSelect(day)}
                        className={cn(
                          "h-8 w-8 p-0 text-sm",
                          isSelected && "bg-primary text-primary-foreground",
                          isToday && !isSelected && "border border-primary"
                        )}
                      >
                        {day}
                      </Button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryPageContent() {
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Convert date range to filter params
  // Always use startDate and endDate for date range filtering
  const getFilterParams = () => {
    if (startDate && endDate) {
      // Always use startDate and endDate for range filtering
      // This ensures consistent filtering behavior
      return { 
        year: null, 
        month: null, 
        date: null, 
        startDate, 
        endDate 
      };
    }
    return { year: null, month: null, date: null, startDate: null, endDate: null };
  };

  const { data, loading, error, refreshData } = useSummaryData(getFilterParams());

  const handleRefresh = () => {
    toast.info("Memperbarui data ringkasan...");
    refreshData(getFilterParams());
  };

  const handleClearFilter = () => {
    setStartDate(null);
    setEndDate(null);
  };



  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ringkasan Konsultasi SPBE</h2>
          <p className="text-muted-foreground">
            Dashboard ringkasan dan analisis data konsultasi
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Perbarui
        </Button>
      </div>

      {/* Filter Section */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Filter Berdasarkan Waktu</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Start Date Picker */}
          <div className="space-y-2">
            <Label>Tanggal Mulai</Label>
            <DatePickerPopup
              value={startDate}
              onChange={(date) => {
                setStartDate(date);
                // Auto-clear end date if start date is after end date
                if (date && endDate && new Date(date) > new Date(endDate)) {
                  setEndDate(null);
                }
              }}
              placeholder="Pilih Tanggal Mulai"
            />
          </div>

          {/* End Date Picker */}
          <div className="space-y-2">
            <Label>Tanggal Akhir</Label>
            <DatePickerPopup
              value={endDate}
              onChange={(date) => {
                if (date && startDate && new Date(date) < new Date(startDate)) {
                  toast.error("Tanggal akhir tidak boleh sebelum tanggal mulai");
                  return;
                }
                setEndDate(date);
              }}
              placeholder="Pilih Tanggal Akhir"
              disabled={!startDate}
            />
          </div>

          {/* Clear Filter Button */}
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button
              variant="outline"
              onClick={handleClearFilter}
              disabled={!startDate && !endDate}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Hapus Filter
            </Button>
          </div>
        </div>
        {(startDate || endDate) && (
          <div className="text-sm text-muted-foreground">
            Menampilkan data:{" "}
            {startDate && endDate
              ? `${new Date(startDate).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })} - ${new Date(endDate).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}`
              : startDate
              ? `Dari ${new Date(startDate).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}`
              : "Semua data"}
          </div>
        )}
      </div>

      {/* Main Summary Cards */}
      <SummaryCards data={data} loading={loading} error={error} />

      {/* Charts Section */}
      <SummaryCharts data={data} loading={loading} error={error} />

      {/* Topik Distribution Chart */}
      <TopikDistributionChart data={data} loading={loading} error={error} />

      {/* Detailed Stats */}
      <DetailedStatsCards data={data} loading={loading} error={error} />

      {/* Monthly Comparison */}
      <MonthlyComparisonChart data={data} loading={loading} error={error} />
    </div>
  );
}

export default function AdminSummaryPage() {
  return (
    <UserProvider>
      <SummaryPageContent />
    </UserProvider>
  );
}
