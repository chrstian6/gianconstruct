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
import { useEffect, useState } from "react";
import { getInventoryByCategory, getCategories } from "@/action/inventory";
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

export function CategoryBarChart() {
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("item");
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoryData, categoryList] = await Promise.all([
          getInventoryByCategory(),
          getCategories(),
        ]);
        setCategoryData(categoryData);
        setCategories(categoryList);
      } catch (error) {
        console.error("Failed to fetch category data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Reset page when category or search changes
  useEffect(() => {
    setPage(0);
  }, [selectedCategory, searchTerm, searchFilter]);

  // Get all items for the selected category with search filtering
  const getAllItems = (): ChartItem[] => {
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
  };

  // Prepare paginated chart data
  const getChartData = (): ChartItem[] => {
    const allItems = getAllItems();
    const startIndex = page * itemsPerPage;
    return allItems.slice(startIndex, startIndex + itemsPerPage);
  };

  const allItems = getAllItems();
  const chartData = getChartData();
  const totalItems = allItems.reduce((sum, item) => sum + item.quantity, 0);
  const displayCategory =
    selectedCategory === "all" ? "All Categories" : selectedCategory;

  // Get the maximum value for setting domain
  const maxDomainValue =
    chartData.length > 0
      ? Math.ceil(Math.max(...chartData.map((item) => item.maxValue)) / 50) * 50
      : 100;

  // Calculate pagination info
  const totalPages = Math.ceil(allItems.length / itemsPerPage);
  const currentPageStart = page * itemsPerPage + 1;
  const currentPageEnd = Math.min((page + 1) * itemsPerPage, allItems.length);
  const hasPagination = allItems.length > itemsPerPage;

  const chartConfig = {
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
  } satisfies ChartConfig;

  // Custom tooltip to show all values
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-md px-3 shadow-md">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.category}</p>
          <p className="text-sm" style={{ color: chartConfig.quantity.color }}>
            Quantity: <strong>{data.quantity?.toLocaleString() || "0"}</strong>
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
  };

  // Skeleton loading for chart area
  const ChartSkeleton = () => (
    <div className="h-64 w-full flex flex-col gap-3">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <Card className="w-full max-w-lg shadow-none border-gray/80">
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
                onClick={() => setSelectedCategory("all")}
                className={selectedCategory === "all" ? "bg-accent" : ""}
              >
                All Categories
              </DropdownMenuItem>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => setSelectedCategory(category)}
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
                  onClick={() => setSearchFilter("item")}
                  className={searchFilter === "item" ? "bg-accent" : ""}
                >
                  Item
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSearchFilter("category")}
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
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchTerm("");
                }}
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
            <ChartContainer config={chartConfig} className="h-64">
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
              >
                <CartesianGrid
                  horizontal={true}
                  vertical={true} // Changed to true to show vertical grid lines
                  strokeDasharray="2 2" // Changed to make grid lines more visible
                  stroke="#e5e7eb" // Light gray color for grid lines
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
                  width={selectedCategory === "all" ? 70 : 70}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => {
                    if (selectedCategory === "all") {
                      return value.length > 22
                        ? `${value.slice(0, 22)}...`
                        : value;
                    }
                    return value.length > 18
                      ? `${value.slice(0, 18)}...`
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
                  fill={chartConfig.quantity.color} // Now uses blue color
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
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0}
                className="h-6 w-6 p-0"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => prev + 1)}
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
