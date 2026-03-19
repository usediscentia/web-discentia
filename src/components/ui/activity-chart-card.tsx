"use client";

import * as React from "react";
import { motion } from "motion/react";
import { ChevronDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ActivityDataPoint {
  day: string;
  value: number;
}

interface ActivityChartCardProps {
  title?: string;
  totalValue: string;
  sublabel?: string;
  trendPositive?: boolean;
  data: ActivityDataPoint[];
  className?: string;
  dropdownOptions?: string[];
  onRangeChange?: (range: string) => void;
}

const barVariants = {
  hidden: { scaleY: 0, opacity: 0 },
  visible: {
    scaleY: 1,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  },
};

export function ActivityChartCard({
  title = "Activity",
  totalValue,
  sublabel,
  trendPositive = true,
  data,
  className,
  dropdownOptions = ["This week", "Last week", "Last month"],
  onRangeChange,
}: ActivityChartCardProps) {
  const [selectedRange, setSelectedRange] = React.useState(
    dropdownOptions[0] || ""
  );

  const maxValue = React.useMemo(
    () => data.reduce((max, item) => (item.value > max ? item.value : max), 0),
    [data]
  );

  function handleSelect(option: string) {
    setSelectedRange(option);
    onRangeChange?.(option);
  }

  return (
    <Card className={cn("w-full", className)} aria-labelledby="activity-card-title">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle id="activity-card-title">{title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto gap-1 px-2 py-1 text-[12px] font-normal text-[#9C9690] hover:text-[#1A1814]"
                aria-haspopup="true"
              >
                {selectedRange}
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {dropdownOptions.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onSelect={() => handleSelect(option)}
                  className="text-[13px]"
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Metric */}
          <div className="flex flex-col gap-1">
            <p className="text-[40px] font-bold leading-none tracking-tight text-[#1A1814] tabular-nums">
              {totalValue}
            </p>
            {sublabel && (
              <span className="flex items-center gap-1 text-[12px] text-[#9C9690]">
                <TrendingUp
                  className={cn(
                    "h-3.5 w-3.5",
                    trendPositive ? "text-[#22C55E]" : "text-red-400"
                  )}
                  aria-hidden="true"
                />
                {sublabel}
              </span>
            )}
          </div>

          {/* Bar chart */}
          <motion.div
            key={selectedRange}
            className="flex h-24 w-full items-end justify-between gap-1.5"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.06 },
              },
            }}
            aria-label={`${title} bar chart`}
            role="img"
          >
            {data.map((item, index) => (
              <div
                key={index}
                className="flex h-full w-full flex-col items-center justify-end gap-1.5"
                role="presentation"
              >
                <motion.div
                  className="w-full origin-bottom rounded-[3px] bg-[#1A1814]"
                  style={{
                    height: `${maxValue > 0 ? Math.max((item.value / maxValue) * 100, 4) : 4}%`,
                    opacity: item.value === 0 ? 0.12 : undefined,
                  }}
                  variants={barVariants}
                  aria-label={`${item.day}: ${item.value}`}
                />
                <span className="text-[10px] text-[#9C9690]">{item.day}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
