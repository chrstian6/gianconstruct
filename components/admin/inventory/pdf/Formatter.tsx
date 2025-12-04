import { IInventory } from "@/types/Inventory";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface PDFFormatterProps {
  inventoryItems: IInventory[];
  categoryStats: Array<{
    category: string;
    count: number;
    totalCapital: number;
    totalValue: number;
  }>;
  totalItems: number;
  inStockCount: number;
  restockNeededCount: number;
  totalCapital: number;
  totalValue: number;
}

// Add jsPDF autoTable types
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
    autoTable: (options: any) => void;
  }
}

// Custom formatCurrency function for PDF using PHP
const formatCurrency = (amount: number): string => {
  return `PHP ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

// Generate uniform report ID: INV + MONTH ABBREV + DAY + 3 RANDOM DIGITS
const generateReportId = (): string => {
  const now = new Date();
  const monthAbbrev = now
    .toLocaleString("en", { month: "short" })
    .toUpperCase();
  const day = now.getDate().toString().padStart(2, "0");
  const randomDigits = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `INV${monthAbbrev}${day}${randomDigits}`;
};

// Format date as "Month DD, YYYY"
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

// Format time as "HH:MM AM/PM"
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Get status information for an item (matching InventoryTable logic)
const getStatusInfo = (item: IInventory) => {
  const quantity = item.quantity;
  const reorderPoint = item.reorderPoint ?? 0;
  if (quantity === 0) {
    return "Out of Stock";
  }
  if (quantity <= reorderPoint) {
    return "Low Stock";
  }
  return "In Stock";
};

export function PDFFormatter({
  inventoryItems,
  categoryStats,
  totalItems,
  inStockCount,
  restockNeededCount,
  totalCapital,
  totalValue,
}: PDFFormatterProps) {
  const generatePDFFile = async (): Promise<Blob | null> => {
    if (inventoryItems.length === 0) return null;

    // Generate report ID and dates
    const reportId = generateReportId();
    const currentDate = new Date();

    // Create PDF document in LANDSCAPE mode
    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ===== PROFESSIONAL BLACK & WHITE HEADER =====
    let currentY = 20;

    // Company Name - Bold
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("GIAN CONSTRUCTION COMPANY", pageWidth / 2, currentY, {
      align: "center",
    });
    currentY += 8;

    // Address - Regular
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      "JY PEREZ AVENUE, KABANKALAN, PHILIPPINES 6111",
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += 5;

    // Contact Info
    doc.setFontSize(9);
    doc.text(
      "Tel: 0908 982 1649 | Email: info@gianconstruct.com",
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += 5;

    // Website
    doc.text("Website: www.gianconstruct.com", pageWidth / 2, currentY, {
      align: "center",
    });
    currentY += 15;

    // ===== INVENTORY REPORT TITLE - REGULAR FONT WEIGHT =====
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("INVENTORY REPORT", pageWidth / 2, currentY, { align: "center" });
    currentY += 10;

    // Horizontal line separator
    doc.setLineWidth(0.5);
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 15;

    // ===== REPORT SUMMARY =====
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Report Summary", 14, currentY);
    currentY += 7;

    doc.setFont("helvetica", "normal");
    const summaryItems = [
      `Report Date: ${formatDate(currentDate)}`,
      `Report Time: ${formatTime(currentDate)}`,
      `Report ID: ${reportId}`,
      `Total Items: ${totalItems}`,
      `In Stock: ${inStockCount}`,
      `Low Stock: ${restockNeededCount}`,
      `Out of Stock: ${inventoryItems.filter((item) => item.quantity === 0).length}`,
      `Total Capital Value: ${formatCurrency(totalCapital)}`,
      `Total Sales Value: ${formatCurrency(totalValue)}`,
      `Potential Profit: ${formatCurrency(totalValue - totalCapital)}`,
    ];

    summaryItems.forEach((item, index) => {
      doc.text(item, 20, currentY + index * 5);
    });
    currentY += summaryItems.length * 5 + 10;

    // ===== CATEGORY SUMMARY =====
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Category Summary", 14, currentY);
    currentY += 7;

    // Prepare category table data
    const categoryTableData = categoryStats.map((stat) => [
      stat.category,
      stat.count.toString(),
      formatCurrency(stat.totalCapital),
      formatCurrency(stat.totalValue),
    ]);

    // Add category summary table
    autoTable(doc, {
      startY: currentY,
      head: [["Category", "Item Count", "Total Capital", "Total Value"]],
      body: categoryTableData,
      theme: "grid",
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 9,
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [0, 0, 0],
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
      },
      styles: {
        cellPadding: 3,
        fontSize: 8,
        halign: "center",
        valign: "middle",
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
      },
      margin: { left: 14, right: 14 },
      tableLineWidth: 0.3,
      tableLineColor: [0, 0, 0],
    });

    // Get the final Y position after the category table
    let finalY = (doc as any).lastAutoTable.finalY + 15;

    // ===== DETAILED INVENTORY ITEMS TABLE =====
    if (finalY > pageHeight - 50) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Detailed Inventory Items", 14, finalY);
    finalY += 8;

    // Prepare detailed table data (aligned with InventoryTable columns)
    const detailedTableData = inventoryItems.map((item) => {
      const unitCost = item.unitCost || 0;
      const salePrice = item.salePrice || 0;
      const totalCapitalValue = item.totalCapital || item.quantity * unitCost;
      const totalValue = item.totalValue || item.quantity * salePrice;
      const status = getStatusInfo(item);
      const dateAdded = new Date(item.timeCreated);

      return [
        item.product_id.substring(0, 8) + "...",
        item.name,
        item.category,
        status,
        item.quantity.toLocaleString(),
        formatCurrency(unitCost),
        formatCurrency(salePrice),
        formatCurrency(totalCapitalValue),
        formatCurrency(totalValue),
        dateAdded.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      ];
    });

    // Add detailed inventory table WITHOUT columnStyles to avoid type issues
    autoTable(doc, {
      startY: finalY,
      head: [
        [
          "ID",
          "Product Name",
          "Category",
          "Status",
          "Quantity",
          "Base Price",
          "Sale Price",
          "Capital",
          "Value",
          "Date Added",
        ],
      ],
      body: detailedTableData,
      theme: "grid",
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 8,
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [0, 0, 0],
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
      },
      styles: {
        cellPadding: 3,
        fontSize: 7,
        halign: "left",
        valign: "middle",
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
        cellWidth: "auto",
      },
      margin: { left: 10, right: 10 },
      tableLineWidth: 0.3,
      tableLineColor: [0, 0, 0],
      // REMOVED columnStyles to fix the type error
      didDrawPage: function (data: any) {
        // Add page numbers
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      },
    });

    // Get the final Y position after the detailed table
    finalY = (doc as any).lastAutoTable.finalY + 10;

    // ===== CLEAN PROFESSIONAL FOOTER =====
    if (finalY > pageHeight - 30) {
      doc.addPage();
      finalY = 20;
    }

    // Horizontal line
    doc.setLineWidth(0.5);
    doc.line(14, finalY, pageWidth - 14, finalY);
    finalY += 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    // Report generation info
    doc.text("Generated by Gian Construction Company", pageWidth / 2, finalY, {
      align: "center",
    });
    finalY += 5;

    doc.text(`Report ID: ${reportId}`, pageWidth / 2, finalY, {
      align: "center",
    });
    finalY += 5;

    doc.text(
      `Total Items: ${totalItems} | Total Capital: ${formatCurrency(totalCapital)}`,
      pageWidth / 2,
      finalY,
      {
        align: "center",
      }
    );
    finalY += 5;

    doc.text(
      `Total Value: ${formatCurrency(totalValue)} | Profit Potential: ${formatCurrency(totalValue - totalCapital)}`,
      pageWidth / 2,
      finalY,
      {
        align: "center",
      }
    );

    // Generate PDF blob
    const pdfBlob = doc.output("blob");
    return pdfBlob;
  };

  // Function to export to PDF
  const exportToPDF = async () => {
    try {
      const pdfBlob = await generatePDFFile();
      if (!pdfBlob) {
        toast.error("No items to export");
        return;
      }

      const link = document.createElement("a");
      const url = URL.createObjectURL(pdfBlob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `GianConstruction-Inventory-Report-${generateReportId()}.pdf`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      toast.success("Inventory report exported to PDF successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to export PDF. Please try again.");
    }
  };

  return {
    generatePDFFile,
    exportToPDF,
  };
}
