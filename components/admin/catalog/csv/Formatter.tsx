import { Design } from "@/types/design";
import ExcelJS from "exceljs";

interface ExcelFormatterProps {
  design: Design;
  selectedTerm: number;
  loanSummary: any;
  paymentSchedule: any[];
  downpaymentAmount: number;
}

// Generate uniform quotation ID: Q + MONTH ABBREV + DAY + 3 RANDOM DIGITS
const generateQuotationId = (): string => {
  const now = new Date();
  const monthAbbrev = now
    .toLocaleString("en", { month: "short" })
    .toUpperCase();
  const day = now.getDate().toString().padStart(2, "0");
  const randomDigits = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `Q${monthAbbrev}${day}${randomDigits}`;
};

// Format date as "Month DD, YYYY"
const formatDate = (date: Date): string => {
  return date.toLocaleString("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export function ExcelFormatter({
  design,
  selectedTerm,
  loanSummary,
  paymentSchedule,
  downpaymentAmount,
}: ExcelFormatterProps) {
  const generateExcelFile = async (): Promise<Blob | null> => {
    if (paymentSchedule.length === 0) return null;

    // Generate quotation ID and dates
    const quotationId = generateQuotationId();
    const currentDate = new Date();
    const validUntilDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Calculate display term
    const displayTerm =
      selectedTerm > 0
        ? design.loanTermType === "years"
          ? `${Math.round(selectedTerm / 12)} years`
          : `${selectedTerm} months`
        : "N/A";

    // Calculate downpayment percentage
    const downpaymentPercentage =
      design.price > 0 ? (downpaymentAmount / design.price) * 100 : 0;

    // Format numbers with commas
    const formatNumberWithCommas = (num: number): string => {
      return `PHP ${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    };

    // Create workbook
    const workbook = new ExcelJS.Workbook();

    // Set workbook properties
    workbook.creator = "GianConstruction";
    workbook.lastModifiedBy = "GianConstruction";
    workbook.created = new Date();
    workbook.modified = new Date();

    // Create worksheet
    const worksheet = workbook.addWorksheet("Loan Quotation");

    // ===== COLUMN WIDTHS =====
    worksheet.columns = [
      { width: 15 }, // Month
      { width: 20 }, // Payment
      { width: 20 }, // Principal
      { width: 20 }, // Interest
      { width: 25 }, // Balance
    ];

    // ===== STYLES =====
    const baseStyle = {
      font: { name: "Poppins", size: 11 },
      alignment: {
        horizontal: "left" as const,
        vertical: "middle" as const,
        indent: 1,
        wrapText: true,
      },
      border: {
        top: { style: "thin" as const },
        left: { style: "thin" as const },
        bottom: { style: "thin" as const },
        right: { style: "thin" as const },
      },
    };

    // Orange background with white text style
    const orangeHeaderStyle = {
      ...baseStyle,
      font: {
        name: "Poppins",
        size: 16,
        bold: true,
        color: { argb: "FFFFFFFF" },
      },
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FFFFA500" }, // Orange color
      },
      alignment: {
        horizontal: "center" as const,
        vertical: "middle" as const,
      },
    };

    const titleStyle = {
      ...baseStyle,
      font: { name: "Poppins", size: 18, bold: true },
      alignment: {
        horizontal: "center" as const,
        vertical: "middle" as const,
      },
    };

    const normalTextStyle = {
      ...baseStyle,
      font: { name: "Poppins", size: 11 },
    };

    const tableHeaderStyle = {
      ...baseStyle,
      font: { name: "Poppins", size: 11, bold: true },
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FFF5F5F5" },
      },
      alignment: {
        horizontal: "center" as const,
        vertical: "middle" as const,
      },
    };

    const tableDataStyle = {
      ...baseStyle,
      font: { name: "Poppins", size: 10 },
      alignment: {
        horizontal: "right" as const,
        vertical: "middle" as const,
      },
    };

    const tableMonthStyle = {
      ...baseStyle,
      font: { name: "Poppins", size: 10 },
      alignment: {
        horizontal: "center" as const,
        vertical: "middle" as const,
      },
    };

    // Footer style with orange background and white text
    const footerStyle = {
      ...baseStyle,
      font: { name: "Poppins", size: 11, color: { argb: "FFFFFFFF" } },
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FFFFA500" }, // Orange color
      },
    };

    const currencyFormat = '"PHP" #,##0.00';

    // ===== COMPANY HEADER WITH ORANGE BACKGROUND =====
    let currentRow = 1;

    // Company Name - ORANGE BACKGROUND, WHITE TEXT
    const companyRow = worksheet.getRow(currentRow);
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    companyRow.getCell(1).value = "GIANCONSTRUCTION COMPANY";
    companyRow.getCell(1).style = {
      ...orangeHeaderStyle,
      font: {
        name: "Poppins",
        size: 20,
        bold: true,
        color: { argb: "FFFFFFFF" },
      },
    };
    companyRow.height = 30;
    currentRow++;

    // Address - ORANGE BACKGROUND, WHITE TEXT
    const addressRow = worksheet.getRow(currentRow);
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    addressRow.getCell(1).value =
      "JY PEREZ AVENUE, KABANKALAN, PHILIPPINES 6111";
    addressRow.getCell(1).style = {
      ...orangeHeaderStyle,
      font: { name: "Poppins", size: 14, color: { argb: "FFFFFFFF" } },
    };
    addressRow.height = 25;
    currentRow++;

    // Contact Info - ORANGE BACKGROUND, WHITE TEXT
    const contactRow = worksheet.getRow(currentRow);
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    contactRow.getCell(1).value =
      "Tel: 0908 982 1649 | Email: info@gianconstruct.com";
    contactRow.getCell(1).style = {
      ...orangeHeaderStyle,
      font: { name: "Poppins", size: 12, color: { argb: "FFFFFFFF" } },
    };
    contactRow.height = 25;
    currentRow++;

    // Website - ORANGE BACKGROUND, WHITE TEXT
    const websiteRow = worksheet.getRow(currentRow);
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    websiteRow.getCell(1).value = "Website: www.gianconstruct.com";
    websiteRow.getCell(1).style = {
      ...orangeHeaderStyle,
      font: { name: "Poppins", size: 12, color: { argb: "FFFFFFFF" } },
    };
    websiteRow.height = 25;
    currentRow++;

    // Empty row
    currentRow++;
    worksheet.getRow(currentRow).height = 10;

    // ===== LOAN QUOTATION TITLE =====
    currentRow++;
    const titleRow = worksheet.getRow(currentRow);
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    titleRow.getCell(1).value = "LOAN QUOTATION";
    titleRow.getCell(1).style = titleStyle;
    titleRow.height = 30;
    currentRow++;

    // Empty row
    currentRow++;
    worksheet.getRow(currentRow).height = 10;

    // ===== PROJECT DETAILS - NORMAL TEXT WITH PADDING =====
    currentRow++;
    const projectLabelRow = worksheet.getRow(currentRow);
    projectLabelRow.getCell(1).value = "Project:";
    projectLabelRow.getCell(2).value = design.name;
    projectLabelRow.getCell(1).style = normalTextStyle;
    projectLabelRow.getCell(2).style = normalTextStyle;
    projectLabelRow.height = 20;
    currentRow++;

    const dateRow = worksheet.getRow(currentRow);
    dateRow.getCell(1).value = "Quotation Date:";
    dateRow.getCell(2).value = formatDate(currentDate);
    dateRow.getCell(1).style = normalTextStyle;
    dateRow.getCell(2).style = normalTextStyle;
    dateRow.height = 20;
    currentRow++;

    const quotationIdRow = worksheet.getRow(currentRow);
    quotationIdRow.getCell(1).value = "Quotation ID:";
    quotationIdRow.getCell(2).value = quotationId;
    quotationIdRow.getCell(1).style = normalTextStyle;
    quotationIdRow.getCell(2).style = normalTextStyle;
    quotationIdRow.height = 20;
    currentRow++;

    // Empty row
    currentRow++;
    worksheet.getRow(currentRow).height = 10;

    // ===== FINANCIAL DETAILS SECTION - UPDATED WITH DOWNPAYMENT =====
    currentRow++;
    const financialDetailsHeaderRow = worksheet.getRow(currentRow);
    financialDetailsHeaderRow.getCell(1).value = "FINANCIAL DETAILS";
    financialDetailsHeaderRow.getCell(1).style = normalTextStyle;
    financialDetailsHeaderRow.height = 20;
    currentRow++;

    // Calculate total cost (loan payments + downpayment)
    const totalCost = loanSummary.totalAmountPaid + downpaymentAmount;

    const financialDetails = [
      {
        label: "Total Project Price:",
        value: formatNumberWithCommas(design.price),
      },
      {
        label: "Downpayment Amount:",
        value: formatNumberWithCommas(downpaymentAmount),
      },
      {
        label: "Downpayment Percentage:",
        value: `${downpaymentPercentage.toFixed(1)}%`,
      },
      {
        label: "Loan Amount:",
        value: formatNumberWithCommas(
          loanSummary.loanAmount || design.price - downpaymentAmount
        ),
      },
      { label: "Loan Term:", value: displayTerm },
      {
        label: "Interest Rate:",
        value: `${design.interestRate}% (${design.interestRateType || "yearly"})`,
      },
      {
        label: "Monthly Payment:",
        value: formatNumberWithCommas(loanSummary.monthlyPayment),
      },
      {
        label: "Total Interest:",
        value: formatNumberWithCommas(loanSummary.totalInterest),
      },
      {
        label: "Total Loan Payments:",
        value: formatNumberWithCommas(loanSummary.totalAmountPaid),
      },
      {
        label: "Total Project Cost:",
        value: formatNumberWithCommas(totalCost),
      },
    ];

    financialDetails.forEach((detail) => {
      const detailRow = worksheet.getRow(currentRow);
      detailRow.getCell(1).value = detail.label;
      detailRow.getCell(2).value = detail.value;
      detailRow.getCell(1).style = normalTextStyle;
      detailRow.getCell(2).style = normalTextStyle;
      detailRow.height = 20;
      currentRow++;
    });

    // Empty rows
    currentRow++;
    worksheet.getRow(currentRow).height = 15;
    currentRow++;
    worksheet.getRow(currentRow).height = 15;

    // ===== PAYMENT SCHEDULE HEADER - NORMAL TEXT WITH PADDING =====
    currentRow++;
    const scheduleHeaderRow = worksheet.getRow(currentRow);
    scheduleHeaderRow.getCell(1).value = "PAYMENT SCHEDULE";
    scheduleHeaderRow.getCell(1).style = normalTextStyle;
    scheduleHeaderRow.height = 20;
    currentRow++;

    // Empty row
    currentRow++;
    worksheet.getRow(currentRow).height = 10;

    // ===== PAYMENT SCHEDULE TABLE HEADERS WITH PADDING =====
    currentRow++;
    const headers = [
      "Month",
      "Payment (PHP)",
      "Principal (PHP)",
      "Interest (PHP)",
      "Remaining Balance (PHP)",
    ];
    const headerRow = worksheet.getRow(currentRow);
    headers.forEach((header, index) => {
      headerRow.getCell(index + 1).value = header;
      headerRow.getCell(index + 1).style = tableHeaderStyle;
    });
    headerRow.height = 25;
    currentRow++;

    // ===== PAYMENT SCHEDULE DATA WITH PADDING =====
    paymentSchedule.forEach((payment) => {
      const dataRow = worksheet.getRow(currentRow);

      // Month - centered with padding
      dataRow.getCell(1).value = payment.month;
      dataRow.getCell(1).style = tableMonthStyle;

      // Payment amounts - right aligned with padding
      dataRow.getCell(2).value = payment.payment;
      dataRow.getCell(2).style = { ...tableDataStyle, numFmt: currencyFormat };

      dataRow.getCell(3).value = payment.principal;
      dataRow.getCell(3).style = { ...tableDataStyle, numFmt: currencyFormat };

      dataRow.getCell(4).value = payment.interest;
      dataRow.getCell(4).style = { ...tableDataStyle, numFmt: currencyFormat };

      dataRow.getCell(5).value = payment.balance;
      dataRow.getCell(5).style = { ...tableDataStyle, numFmt: currencyFormat };

      dataRow.height = 22; // Increased height for better padding
      currentRow++;
    });

    // Empty rows
    currentRow++;
    worksheet.getRow(currentRow).height = 15;
    currentRow++;
    worksheet.getRow(currentRow).height = 15;

    // ===== SUMMARY SECTION - UPDATED WITH DOWNPAYMENT =====
    currentRow++;
    const summaryHeaderRow = worksheet.getRow(currentRow);
    summaryHeaderRow.getCell(1).value = "FINANCIAL SUMMARY";
    summaryHeaderRow.getCell(1).style = normalTextStyle;
    summaryHeaderRow.height = 20;
    currentRow++;

    const summaryDetails = [
      {
        label: "Downpayment Paid:",
        value: formatNumberWithCommas(downpaymentAmount),
      },
      {
        label: "Total Loan Payments:",
        value: formatNumberWithCommas(loanSummary.totalAmountPaid),
      },
      {
        label: "Total Interest Paid:",
        value: formatNumberWithCommas(loanSummary.totalInterest),
      },
      {
        label: "Total Project Cost:",
        value: formatNumberWithCommas(totalCost),
      },
    ];

    summaryDetails.forEach((detail) => {
      const detailRow = worksheet.getRow(currentRow);
      detailRow.getCell(1).value = detail.label;
      detailRow.getCell(2).value = detail.value;
      detailRow.getCell(1).style = normalTextStyle;
      detailRow.getCell(2).style = normalTextStyle;
      detailRow.height = 20;
      currentRow++;
    });

    // Empty rows
    currentRow++;
    worksheet.getRow(currentRow).height = 15;
    currentRow++;
    worksheet.getRow(currentRow).height = 15;

    // ===== FOOTER INFORMATION - ORANGE BACKGROUND, WHITE TEXT =====
    currentRow++;
    const footer1Row = worksheet.getRow(currentRow);
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    footer1Row.getCell(1).value = "Generated by GianConstruction Company";
    footer1Row.getCell(1).style = footerStyle;
    footer1Row.height = 25;
    currentRow++;

    const footer2Row = worksheet.getRow(currentRow);
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    footer2Row.getCell(1).value = `Quotation ID: ${quotationId}`;
    footer2Row.getCell(1).style = footerStyle;
    footer2Row.height = 25;
    currentRow++;

    const footer3Row = worksheet.getRow(currentRow);
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    footer3Row.getCell(1).value = `Valid Until: ${formatDate(validUntilDate)}`;
    footer3Row.getCell(1).style = footerStyle;
    footer3Row.height = 25;

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  };

  // Function to export to Excel
  const exportToExcel = async () => {
    const excelBlob = await generateExcelFile();
    if (!excelBlob) return;

    const link = document.createElement("a");
    const url = URL.createObjectURL(excelBlob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `GianConstruction-Loan-Quotation-${generateQuotationId()}.xlsx`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    generateExcelFile,
    exportToExcel,
  };
}
