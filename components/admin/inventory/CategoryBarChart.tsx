// components/admin/inventory/CategoryBarChart.tsx
"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CategoryData {
  category: string;
  items: {
    name: string;
    quantity: number;
    reorderPoint: number;
    safetyStock?: number;
  }[];
}

interface ChartItem {
  name: string;
  quantity: number;
  reorderPoint: number;
  safetyStock?: number;
  maxValue: number;
  category: string;
}

type SearchFilter = "item" | "category";

interface CategoryBarChartProps {
  categoryData: CategoryData[];
  categories: string[];
  loading: boolean;
}

export function CategoryBarChart({
  categoryData = [],
  categories = [],
  loading = true,
}: CategoryBarChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("item");
  const itemsPerPage = 6;

  // Reset page when category or search changes
  useEffect(() => {
    setPage(0);
  }, [selectedCategory, searchTerm, searchFilter]);

  // Get all items for the selected category with search filtering - memoized
  const getAllItems = useCallback((): ChartItem[] => {
    let allItems: ChartItem[] = [];

    if (selectedCategory === "all") {
      // Show all items across all categories
      categoryData.forEach((category) => {
        category.items.forEach((item) => {
          const maxValue =
            Math.max(item.quantity, item.reorderPoint, item.safetyStock || 0) *
            1.1;

          allItems.push({
            name: item.name,
            quantity: item.quantity,
            reorderPoint: item.reorderPoint,
            safetyStock: item.safetyStock,
            maxValue,
            category: category.category,
          });
        });
      });
    } else {
      // Show items from selected category
      const category = categoryData.find(
        (cat) => cat.category === selectedCategory
      );
      if (category) {
        category.items.forEach((item) => {
          const maxValue =
            Math.max(item.quantity, item.reorderPoint, item.safetyStock || 0) *
            1.1;

          allItems.push({
            name: item.name,
            quantity: item.quantity,
            reorderPoint: item.reorderPoint,
            safetyStock: item.safetyStock,
            maxValue,
            category: category.category,
          });
        });
      }
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      allItems = allItems.filter((item) => {
        if (searchFilter === "item") {
          return (
            item.name.toLowerCase().includes(term) ||
            item.category.toLowerCase().includes(term)
          );
        } else {
          return item.category.toLowerCase().includes(term);
        }
      });
    }

    // Sort by quantity descending
    return allItems.sort((a, b) => b.quantity - a.quantity);
  }, [categoryData, selectedCategory, searchTerm, searchFilter]);

  // Prepare paginated chart data - memoized
  const getChartData = useCallback((): ChartItem[] => {
    const allItems = getAllItems();
    const startIndex = page * itemsPerPage;
    return allItems.slice(startIndex, startIndex + itemsPerPage);
  }, [getAllItems, page, itemsPerPage]);

  // Memoized values to prevent recalculations
  const allItems = useMemo(() => getAllItems(), [getAllItems]);
  const chartData = useMemo(() => getChartData(), [getChartData]);
  const totalItems = useMemo(
    () => allItems.reduce((sum, item) => sum + item.quantity, 0),
    [allItems]
  );
  const displayCategory = useMemo(
    () => (selectedCategory === "all" ? "All Categories" : selectedCategory),
    [selectedCategory]
  );

  // Get the maximum value for setting domain - memoized
  const maxDomainValue = useMemo(
    () =>
      chartData.length > 0
        ? Math.ceil(Math.max(...chartData.map((item) => item.maxValue)) / 50) *
          50
        : 100,
    [chartData]
  );

  // Calculate pagination info - memoized
  const totalPages = useMemo(
    () => Math.ceil(allItems.length / itemsPerPage),
    [allItems.length, itemsPerPage]
  );
  const currentPageStart = useMemo(
    () => page * itemsPerPage + 1,
    [page, itemsPerPage]
  );
  const currentPageEnd = useMemo(
    () => Math.min((page + 1) * itemsPerPage, allItems.length),
    [page, itemsPerPage, allItems.length]
  );
  const hasPagination = useMemo(
    () => allItems.length > itemsPerPage,
    [allItems.length, itemsPerPage]
  );

  const chartConfig = useMemo(
    () =>
      ({
        quantity: {
          label: "Quantity",
          color: "#3b82f6", // Changed to blue-500
        },
        reorderPoint: {
          label: "Reorder Point",
          color: "hsl(var(--chart-2))",
        },
        safetyStock: {
          label: "Safety Stock",
          color: "hsl(var(--chart-3))",
        },
      }) satisfies ChartConfig,
    []
  );

  // Custom tooltip to show all values - memoized
  const CustomTooltip = useCallback(
    ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-background border rounded-md px-3 shadow-md">
            <p className="font-medium">{data.name}</p>
            <p className="text-sm text-muted-foreground">{data.category}</p>
            <p
              className="text-sm"
              style={{ color: chartConfig.quantity.color }}
            >
              Quantity:{" "}
              <strong>{data.quantity?.toLocaleString() || "0"}</strong>
            </p>
            <p
              className="text-sm"
              style={{ color: chartConfig.reorderPoint.color }}
            >
              Reorder Point:{" "}
              <strong>{data.reorderPoint?.toLocaleString() || "0"}</strong>
            </p>
            {data.safetyStock !== undefined && data.safetyStock !== null && (
              <p
                className="text-sm"
                style={{ color: chartConfig.safetyStock.color }}
              >
                Safety Stock:{" "}
                <strong>{data.safetyStock?.toLocaleString() || "0"}</strong>
              </p>
            )}
          </div>
        );
      }
      return null;
    },
    [chartConfig]
  );

  // Skeleton loading for chart area - memoized
  const ChartSkeleton = useCallback(
    () => (
      <div className="h-64 w-full flex flex-col gap-3">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    ),
    []
  );

  // Event handlers - memoized
  const clearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleSearchFilterChange = useCallback((filter: SearchFilter) => {
    setSearchFilter(filter);
  }, []);

  const handlePreviousPage = useCallback(() => {
    setPage((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedCategory("all");
    setSearchTerm("");
  }, []);

  return (
    <Card className="w-full shadow-none border-gray/80 rounded-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Materials by Category</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                {selectedCategory === "all"
                  ? "All Categories"
                  : selectedCategory}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => handleCategoryChange("all")}
                className={selectedCategory === "all" ? "bg-accent" : ""}
              >
                All Categories
              </DropdownMenuItem>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={selectedCategory === category ? "bg-accent" : ""}
                >
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription>{displayCategory}</CardDescription>

        {/* Search and Filter Section */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder={`Search by ${searchFilter}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-7 h-8 text-xs"
              />
              {searchTerm && (
                <X
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={clearSearch}
                />
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2">
                  <span className="text-xs">
                    {searchFilter === "item" ? "Item" : "Category"}
                  </span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem
                  onClick={() => handleSearchFilterChange("item")}
                  className={searchFilter === "item" ? "bg-accent" : ""}
                >
                  Item
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSearchFilterChange("category")}
                  className={searchFilter === "category" ? "bg-accent" : ""}
                >
                  Category
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Active filters badge */}
          {(searchTerm || selectedCategory !== "all") && (
            <div className="flex flex-wrap gap-1">
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Category: {selectedCategory}
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Search: {searchTerm}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-5 text-xs p-1"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-1">
        {loading ? (
          <ChartSkeleton />
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart
                accessibilityLayer
                data={chartData}
                layout="vertical"
                margin={{
                  top: 0,
                  right: 100,
                  left: selectedCategory === "all" ? 0 : 0,
                  bottom: 5,
                }}
                barSize={18}
                height={360}
                width={800} // Increased width for full width display
              >
                <CartesianGrid
                  horizontal={true}
                  vertical={true}
                  strokeDasharray="2 2"
                  stroke="#e5e7eb"
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  domain={[0, maxDomainValue]}
                  tickCount={6}
                  tickFormatter={(value) => Math.round(value).toLocaleString()}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={selectedCategory === "all" ? 120 : 100} // Increased width for better text display
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => {
                    if (selectedCategory === "all") {
                      return value.length > 25
                        ? `${value.slice(0, 25)}...`
                        : value;
                    }
                    return value.length > 22
                      ? `${value.slice(0, 22)}...`
                      : value;
                  }}
                />
                <ChartTooltip content={<CustomTooltip />} />

                {/* Safety Stock Reference Lines */}
                {chartData.map(
                  (item, index) =>
                    item.safetyStock && (
                      <ReferenceLine
                        key={`safety-${index}`}
                        x={item.safetyStock}
                        stroke={chartConfig.safetyStock.color}
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        yAxisId={0}
                      />
                    )
                )}

                {/* Reorder Point Reference Lines */}
                {chartData.map((item, index) => (
                  <ReferenceLine
                    key={`reorder-${index}`}
                    x={item.reorderPoint}
                    stroke={chartConfig.reorderPoint.color}
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    yAxisId={0}
                  />
                ))}

                <Bar
                  dataKey="quantity"
                  layout="vertical"
                  fill={chartConfig.quantity.color}
                  radius={[0, 4, 4, 0]}
                >
                  <LabelList
                    dataKey="quantity"
                    position="right"
                    offset={10}
                    className="fill-foreground text-xs"
                    fontSize={11}
                    formatter={(value: number) => value.toLocaleString()}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: chartConfig.quantity.color }}
                />
                <span>Current Quantity</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-0.5"
                  style={{
                    backgroundColor: chartConfig.reorderPoint.color,
                    borderTop: `2px dashed ${chartConfig.reorderPoint.color}`,
                  }}
                />
                <span>Reorder Point</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-0.5"
                  style={{
                    backgroundColor: chartConfig.safetyStock.color,
                    borderTop: `2px dashed ${chartConfig.safetyStock.color}`,
                  }}
                />
                <span>Safety Stock</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-xs pt-0">
        <div className="flex justify-between w-full items-center">
          <div className="flex gap-1 leading-none font-medium">
            {loading ? (
              <Skeleton className="h-4 w-40" />
            ) : (
              <>
                Showing {currentPageStart}-{currentPageEnd} of {allItems.length}{" "}
                items
              </>
            )}
          </div>
          {hasPagination && !loading && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={page === 0}
                className="h-6 w-6 p-0"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page >= totalPages - 1}
                className="h-6 w-6 p-0"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          {loading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <>Total quantity: {totalItems.toLocaleString()}</>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
