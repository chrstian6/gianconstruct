"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  AlertCircle,
  Loader2,
  Printer,
  Bluetooth,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getInventoryItems,
  searchInventoryItems,
  updateInventoryQuantity,
  createInventoryPOSPayment,
} from "@/action/inventoryPOS";
import {
  InventoryItem,
  POSCartItem,
  InventoryPOSPayment,
} from "@/types/inventory-pos";

interface InventoryPOSProps {
  onPaymentProcess?: (paymentData: InventoryPOSPayment) => void;
}

// Web Bluetooth Printer Service
class WebBluetoothPrinter {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private isConnected: boolean = false;

  // ESC/POS commands
  private readonly ESC = 0x1b;
  private readonly FS = 0x1c;
  private readonly GS = 0x1d;

  async connect(): Promise<boolean> {
    try {
      console.log("Requesting Bluetooth device...");

      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          "generic_access",
          "000018f0-0000-1000-8000-00805f9b34fb",
        ], // Common printer service
      });

      console.log("Connecting to GATT server...");
      const server = await this.device.gatt?.connect();

      if (!server) {
        throw new Error("Failed to connect to GATT server");
      }

      // Try common printer services
      const services = [
        "000018f0-0000-1000-8000-00805f9b34fb", // Common thermal printer service
        "00001101-0000-1000-8000-00805f9b34fb", // Serial Port Profile
        "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // BLE printer service
      ];

      let serviceFound = false;
      for (const serviceUUID of services) {
        try {
          const service = await server.getPrimaryService(serviceUUID);
          const characteristics = await service.getCharacteristics();

          for (const char of characteristics) {
            // Look for write characteristic
            if (char.properties.write || char.properties.writeWithoutResponse) {
              this.characteristic = char;
              serviceFound = true;
              break;
            }
          }

          if (serviceFound) break;
        } catch (e) {
          console.log(`Service ${serviceUUID} not found, trying next...`);
          continue;
        }
      }

      if (!serviceFound || !this.characteristic) {
        throw new Error("No suitable printer service found");
      }

      this.isConnected = true;

      // Store device info for reconnection
      if (this.device.id && this.device.name) {
        localStorage.setItem(
          "lastBluetoothPrinter",
          JSON.stringify({
            id: this.device.id,
            name: this.device.name,
          })
        );
      }

      console.log("Bluetooth printer connected successfully");
      return true;
    } catch (error) {
      console.error("Bluetooth connection failed:", error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
    this.isConnected = false;
    localStorage.removeItem("lastBluetoothPrinter");
  }

  async print(text: string): Promise<void> {
    if (!this.isConnected || !this.characteristic) {
      throw new Error("Printer not connected");
    }

    try {
      // Convert text to bytes (UTF-8)
      const encoder = new TextEncoder();
      let data = encoder.encode(text);

      // Add ESC/POS initialization and formatting
      const escPosCommands = new Uint8Array([
        this.ESC,
        0x40, // Initialize printer
        this.ESC,
        0x21,
        0x00, // Default text size
        ...data,
        0x0a,
        0x0a,
        0x0a,
        0x0a, // Line feeds
        0x1d,
        0x56,
        0x41,
        0x10, // Cut paper (partial)
      ]);

      // Send data in chunks if needed
      const chunkSize = 512;
      for (let i = 0; i < escPosCommands.length; i += chunkSize) {
        const chunk = escPosCommands.slice(i, i + chunkSize);
        await this.characteristic.writeValue(chunk);
      }
    } catch (error) {
      console.error("Print failed:", error);
      throw error;
    }
  }

  async printReceipt(transaction: InventoryPOSPayment): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Printer not connected");
    }

    // Generate receipt text
    const receiptText = this.generateReceiptText(transaction);
    await this.print(receiptText);
  }

  private generateReceiptText(transaction: InventoryPOSPayment): string {
    const date = new Date(transaction.transactionDate).toLocaleString();

    let receipt = "\x1B\x40"; // Initialize printer
    receipt += "\x1B\x21\x00"; // Reset formatting

    // Header
    receipt += "\x1B\x21\x10"; // Double height
    receipt += "POS SYSTEM\n";
    receipt += "\x1B\x21\x00"; // Normal text
    receipt += "SALES RECEIPT\n";
    receipt += `Ref: ${transaction.referenceNumber}\n`;
    receipt += `Date: ${date}\n`;
    receipt += "=".repeat(32) + "\n\n";

    // Items
    receipt += "QTY  ITEM                AMOUNT\n";
    receipt += "-".repeat(32) + "\n";

    transaction.items.forEach((item) => {
      const name =
        item.name.length > 20
          ? item.name.substring(0, 17) + "..."
          : item.name.padEnd(20);
      const qty = item.quantity.toString().padStart(2);
      const price = `₱${item.totalPrice.toFixed(2)}`.padStart(8);
      receipt += `${qty}x  ${name} ${price}\n`;
      receipt += `     @₱${item.unitPrice.toFixed(2)}/${item.unit}\n`;
    });

    receipt += "\n" + "=".repeat(32) + "\n";

    // Totals
    receipt += `Subtotal:        ₱${transaction.subtotal.toFixed(2).padStart(10)}\n`;

    if (transaction.discountAmount && transaction.discountAmount > 0) {
      receipt += `Discount:        -₱${transaction.discountAmount.toFixed(2).padStart(9)}\n`;
    }

    if (transaction.taxAmount && transaction.taxAmount > 0) {
      receipt += `VAT:             +₱${transaction.taxAmount.toFixed(2).padStart(9)}\n`;
    }

    receipt += "\x1B\x21\x10"; // Double height
    receipt += `TOTAL:           ₱${transaction.totalAmount.toFixed(2).padStart(10)}\n`;
    receipt += "\x1B\x21\x00"; // Normal text

    receipt += "\n" + "-".repeat(32) + "\n";
    receipt += `Paid:            ₱${transaction.amountPaid.toFixed(2).padStart(10)}\n`;
    receipt += `Change:          ₱${transaction.change.toFixed(2).padStart(10)}\n`;

    // Footer
    receipt += "\n" + "=".repeat(32) + "\n";
    receipt += "THANK YOU!\n";
    receipt += "This receipt is computer generated\n";
    receipt += "No signature required\n";

    // Cut paper
    receipt += "\x1D\x56\x41\x10"; // Partial cut

    return receipt;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getDeviceName(): string {
    return this.device?.name || "Unknown";
  }
}

export function InventoryPOS({ onPaymentProcess }: InventoryPOSProps) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInput, setPaymentInput] = useState("0");
  const [activeTab, setActiveTab] = useState("payment");
  const [lastTransaction, setLastTransaction] =
    useState<InventoryPOSPayment | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [bluetoothPrinter, setBluetoothPrinter] =
    useState<WebBluetoothPrinter | null>(null);
  const [isConnectingBluetooth, setIsConnectingBluetooth] = useState(false);
  const [printMethod, setPrintMethod] = useState<"browser" | "bluetooth">(
    "browser"
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const printWindowRef = useRef<Window | null>(null);
  const initialLoadAttempted = useRef(false);

  // Initialize Bluetooth printer
  useEffect(() => {
    const printer = new WebBluetoothPrinter();
    setBluetoothPrinter(printer);

    // Check if Web Bluetooth is supported
    if (!navigator.bluetooth) {
      console.warn("Web Bluetooth API is not supported in this browser");
      toast.warning(
        "Bluetooth printing not supported in your browser. Use Chrome/Edge for Bluetooth features."
      );
    }

    return () => {
      if (printer.getConnectionStatus()) {
        printer.disconnect();
      }
    };
  }, []);

  // Load initial inventory items on component mount
  useEffect(() => {
    if (!initialLoadAttempted.current) {
      initialLoadAttempted.current = true;
      loadInitialItems();
    }
  }, []);

  const loadInitialItems = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      console.log("Loading initial inventory items...");
      const result = await getInventoryItems();
      console.log("Inventory items result:", result);

      if (result.success && result.items) {
        const randomItems = result.items
          .sort(() => 0.5 - Math.random())
          .slice(0, 10);
        setInventoryItems(randomItems);
        console.log("Successfully loaded", randomItems.length, "items");
      } else {
        const errorMessage = result.error || "Failed to load inventory";
        setLoadError(errorMessage);
        toast.error(errorMessage);
        console.error("Inventory load failed:", errorMessage);
      }
    } catch (error: any) {
      console.error("Error loading initial items:", error);
      const errorMessage = error.message || "Error loading inventory items";
      setLoadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRandomItems = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await getInventoryItems();
      if (result.success && result.items) {
        const randomItems = result.items
          .sort(() => 0.5 - Math.random())
          .slice(0, 10);
        setInventoryItems(randomItems);
      } else {
        const errorMessage = result.error || "Failed to load inventory";
        setLoadError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || "Error loading inventory items";
      setLoadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const connectBluetoothPrinter = async () => {
    if (!navigator.bluetooth) {
      toast.error(
        "Web Bluetooth API is not supported in this browser. Please use Chrome or Edge."
      );
      return;
    }

    setIsConnectingBluetooth(true);
    try {
      if (bluetoothPrinter) {
        const connected = await bluetoothPrinter.connect();
        if (connected) {
          toast.success(
            `Connected to Bluetooth printer: ${bluetoothPrinter.getDeviceName()}`
          );
          setPrintMethod("bluetooth");
        }
      }
    } catch (error: any) {
      console.error("Bluetooth connection error:", error);
      toast.error(`Failed to connect: ${error.message || "Unknown error"}`);
    } finally {
      setIsConnectingBluetooth(false);
    }
  };

  const disconnectBluetoothPrinter = async () => {
    if (bluetoothPrinter) {
      await bluetoothPrinter.disconnect();
      toast.info("Bluetooth printer disconnected");
      setPrintMethod("browser");
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setIsSearching(false);
      loadRandomItems();
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchInventoryItems(query);
      if (result.success) {
        setInventoryItems(result.items.slice(0, 20));
      } else {
        toast.error(result.error || "Search failed");
      }
    } catch (error) {
      toast.error("Error searching items");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  const addToCart = (item: InventoryItem) => {
    if (item.quantity < 1) {
      toast.error("Item out of stock");
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (ci) => ci.product_id === item.product_id
      );

      if (existingItem) {
        if (existingItem.quantity + 1 > item.quantity) {
          toast.error("Insufficient stock");
          return prevCart;
        }
        return prevCart.map((ci) =>
          ci.product_id === item.product_id
            ? {
                ...ci,
                quantity: ci.quantity + 1,
                totalPrice: (ci.quantity + 1) * ci.unitPrice,
              }
            : ci
        );
      }

      return [
        ...prevCart,
        {
          product_id: item.product_id,
          name: item.name,
          category: item.category,
          quantity: 1,
          unit: item.unit,
          unitPrice: item.salePrice || item.unitCost,
          totalPrice: item.salePrice || item.unitCost,
          availableQuantity: item.quantity,
          description: item.description,
        },
      ];
    });

    // REMOVED: toast.success(`${item.name} added to cart`);
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find((ci) => ci.product_id === productId);
    if (item && newQuantity > item.availableQuantity) {
      toast.error("Insufficient stock available");
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              quantity: newQuantity,
              totalPrice: newQuantity * item.unitPrice,
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product_id !== productId)
    );
    toast.success("Item removed from cart");
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  // FIXED: Removed VAT calculations
  const subtotal = calculateSubtotal();
  const discountAmount = (subtotal * discountPercentage) / 100;
  const totalAmount = subtotal - discountAmount;
  const paymentAmount = parseFloat(paymentInput) || 0;
  const change = Math.max(0, paymentAmount - totalAmount);

  const handleNumpadClick = (value: string) => {
    if (value === "C") {
      setPaymentInput("0");
    } else if (value === "←") {
      setPaymentInput((prev) => (prev.length === 1 ? "0" : prev.slice(0, -1)));
    } else if (value === ".") {
      if (!paymentInput.includes(".")) {
        setPaymentInput((prev) => prev + ".");
      }
    } else {
      setPaymentInput((prev) => (prev === "0" ? value : prev + value));
    }
  };

  const generateThermalReceipt = (transaction: InventoryPOSPayment) => {
    const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Receipt</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Courier New', monospace;
            width: 58mm;
            padding: 2mm;
        }
        @page {
            size: 58mm auto;
            margin: 0;
        }
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
        }
        .receipt {
            width: 100%;
            font-size: 11px;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px dashed #000;
        }
        .shop-name {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 2px;
        }
        .receipt-title {
            font-weight: bold;
            font-size: 11px;
            margin: 4px 0;
        }
        .receipt-info {
            font-size: 10px;
            color: #333;
            margin-bottom: 4px;
        }
        .divider {
            border-bottom: 1px dashed #000;
            margin: 6px 0;
        }
        .items {
            margin: 8px 0;
        }
        .item-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 4px;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
        }
        .item-row {
            display: block;
            margin-bottom: 4px;
            font-size: 10px;
        }
        .item-name {
            font-weight: bold;
            margin-bottom: 1px;
        }
        .item-details {
            display: flex;
            justify-content: space-between;
            font-size: 9px;
        }
        .totals {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed #000;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
            font-size: 10px;
        }
        .total-row.highlight {
            font-weight: bold;
            font-size: 12px;
            margin-top: 4px;
            padding-top: 4px;
            border-top: 1px solid #000;
        }
        .discount-row {
            color: #008000;
        }
        .vat-row {
            color: #333;
        }
        .footer {
            text-align: center;
            margin-top: 8px;
            font-size: 10px;
            border-top: 1px dashed #000;
            padding-top: 8px;
        }
        .thank-you {
            font-weight: bold;
            margin-bottom: 2px;
        }
        .reference {
            font-size: 9px;
            color: #666;
            margin-top: 4px;
        }
        .datetime {
            font-size: 9px;
            color: #666;
            margin-top: 2px;
        }
        .client-info {
            font-size: 9px;
            margin-top: 4px;
            border-top: 1px dashed #000;
            padding-top: 4px;
        }
        .payment-info {
            font-size: 9px;
            margin-top: 2px;
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div class="shop-name">POS SYSTEM</div>
            <div class="receipt-title">SALES RECEIPT</div>
            <div class="receipt-info">Ref: ${transaction.referenceNumber}</div>
        </div>

        <div class="items">
            <div class="item-header">
                <span style="flex: 0.5;">QTY</span>
                <span style="flex: 2;">PRODUCT</span>
                <span style="flex: 1; text-align: right;">PRICE</span>
            </div>
            ${transaction.items
              .map(
                (item) => `
            <div class="item-row">
                <div class="item-name">${item.quantity}x ${item.name}</div>
                <div class="item-details">
                    <span>${item.unit} @ ₱${item.unitPrice.toFixed(2)}</span>
                    <span style="text-align: right; font-weight: bold;">₱${item.totalPrice.toFixed(2)}</span>
                </div>
            </div>
            `
              )
              .join("")}
        </div>

        <div class="totals">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>₱${transaction.subtotal.toFixed(2)}</span>
            </div>
            ${
              transaction.discountAmount
                ? `
            <div class="total-row discount-row">
                <span>Discount (${transaction.discountPercentage}%):</span>
                <span>-₱${transaction.discountAmount.toFixed(2)}</span>
            </div>
            `
                : ""
            }
            ${
              transaction.taxAmount
                ? `
            <div class="total-row vat-row">
                <span>VAT (${transaction.taxPercentage}%):</span>
                <span>+₱${transaction.taxAmount.toFixed(2)}</span>
            </div>
            `
                : ""
            }
            <div class="total-row highlight">
                <span>TOTAL:</span>
                <span>₱${transaction.totalAmount.toFixed(2)}</span>
            </div>

            <div class="total-row">
                <span>Amount Paid:</span>
                <span>₱${transaction.amountPaid.toFixed(2)}</span>
            </div>
            <div class="total-row" style="color: #008000; font-weight: bold;">
                <span>Change:</span>
                <span>₱${transaction.change.toFixed(2)}</span>
            </div>
        </div>

        ${
          transaction.clientInfo.clientName
            ? `
        <div class="client-info">
            <div><strong>Customer:</strong> ${transaction.clientInfo.clientName}</div>
            ${transaction.clientInfo.clientPhone ? `<div>Tel: ${transaction.clientInfo.clientPhone}</div>` : ""}
        </div>
        `
            : ""
        }

        <div class="payment-info">
            <div><strong>Payment:</strong> ${transaction.paymentMethod}</div>
            <div><strong>Type:</strong> ${transaction.paymentType}</div>
        </div>

        <div class="footer">
            <div class="thank-you">THANK YOU!</div>
            <div class="reference">${new Date(transaction.transactionDate).toLocaleString()}</div>
        </div>
    </div>
</body>
</html>
    `;

    return receiptHTML;
  };

  const handlePrintReceipt = async (transaction: InventoryPOSPayment) => {
    setIsPrinting(true);
    try {
      if (
        printMethod === "bluetooth" &&
        bluetoothPrinter?.getConnectionStatus()
      ) {
        await bluetoothPrinter.printReceipt(transaction);
        toast.success("Receipt sent to Bluetooth printer!");
      } else {
        // Fallback to browser printing
        const receiptHTML = generateThermalReceipt(transaction);

        if (printWindowRef.current) {
          printWindowRef.current.close();
        }

        printWindowRef.current = window.open("", "_blank");
        if (printWindowRef.current) {
          printWindowRef.current.document.write(receiptHTML);
          printWindowRef.current.document.close();

          setTimeout(() => {
            if (printWindowRef.current) {
              printWindowRef.current.print();
            }
          }, 250);
        }
        toast.success("Receipt printed successfully!");
      }
    } catch (error: any) {
      console.error("Print error:", error);
      toast.error(`Print failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePaymentConfirm = async () => {
    if (paymentAmount < totalAmount) {
      toast.error("Insufficient payment amount");
      return;
    }

    setShowPaymentModal(false);
    await handleCheckout(paymentAmount);
  };

  const handleCheckout = async (amountPaid: number) => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      for (const item of cart) {
        const result = await updateInventoryQuantity(
          item.product_id,
          item.quantity
        );
        if (!result.success) {
          toast.error(
            `Failed to update inventory for ${item.name}: ${result.error}`
          );
          setIsProcessing(false);
          return;
        }
      }

      const paymentData: InventoryPOSPayment = {
        id: `POS-${Date.now()}`,
        referenceNumber: `REF-${Math.random()
          .toString(36)
          .substr(2, 9)
          .toUpperCase()}`,
        transactionDate: new Date().toISOString(),
        clientInfo: {
          clientName: clientName || "Walk-in Customer",
          clientEmail: clientEmail || "",
          clientPhone: clientPhone || "",
          clientAddress: clientAddress || "",
        },
        paymentMethod: "cash",
        paymentType: "full",
        items: cart,
        subtotal,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        discountPercentage:
          discountPercentage > 0 ? discountPercentage : undefined,
        totalAmount,
        amountPaid,
        change,
        status: "completed",
      };

      const saveResult = await createInventoryPOSPayment(paymentData);

      if (!saveResult.success) {
        toast.error(saveResult.error || "Failed to save transaction");
        setIsProcessing(false);
        return;
      }

      setLastTransaction(paymentData);

      if (onPaymentProcess) {
        onPaymentProcess(paymentData);
      }

      // Auto print receipt with selected method
      await handlePrintReceipt(paymentData);

      // Reset form
      setCart([]);
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setClientAddress("");
      setDiscountPercentage(0);
      setPaymentInput("0");
      setActiveTab("payment");

      await loadRandomItems();

      toast.success("Transaction completed successfully!");
    } catch (error) {
      toast.error("Error processing transaction");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearCart = () => {
    setCart([]);
    toast.info("Cart cleared");
  };

  const renderBluetoothControls = () => (
    <div className="flex items-center gap-2">
      {bluetoothPrinter?.getConnectionStatus() ? (
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="text-xs bg-green-100 text-green-800"
          >
            <Bluetooth className="h-3 w-3 mr-1" />
            Connected
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={disconnectBluetoothPrinter}
            className="h-7 text-xs"
            disabled={isPrinting}
          >
            Disconnect
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={connectBluetoothPrinter}
          disabled={isConnectingBluetooth || !navigator.bluetooth}
          className="h-7 text-xs"
        >
          {isConnectingBluetooth ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Bluetooth className="h-3 w-3 mr-1" />
          )}
          Connect BT
        </Button>
      )}

      {/* Print Method Selector */}
      <Select
        value={printMethod}
        onValueChange={(value: "browser" | "bluetooth") =>
          setPrintMethod(value)
        }
      >
        <SelectTrigger className="w-28 h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="browser" className="text-xs">
            <Printer className="h-3 w-3 mr-2 inline" />
            Browser
          </SelectItem>
          <SelectItem
            value="bluetooth"
            className="text-xs"
            disabled={!bluetoothPrinter?.getConnectionStatus()}
          >
            <Bluetooth className="h-3 w-3 mr-2 inline" />
            Bluetooth
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const renderInventoryItems = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">
            Loading items...
          </span>
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive mb-2">Failed to load items</p>
          <p className="text-xs text-muted-foreground mb-3">{loadError}</p>
          <Button
            onClick={loadInitialItems}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      );
    }

    if (inventoryItems.length > 0) {
      return (
        <div className="space-y-1">
          {inventoryItems.map((item) => (
            <div
              key={item.product_id}
              className="flex items-center justify-between p-2 border border-border rounded text-xs cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => addToCart(item)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <h3 className="font-medium text-foreground truncate">
                    {item.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>₱{(item.salePrice || item.unitCost).toFixed(2)}</span>
                  <span
                    className={
                      item.quantity > 10
                        ? "text-green-600"
                        : item.quantity > 0
                          ? "text-orange-600"
                          : "text-destructive"
                    }
                  >
                    {item.quantity} {item.unit}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                className="h-6 w-6 p-0 ml-1 flex-shrink-0"
                disabled={item.quantity < 1}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-1">No items found</p>
        <p className="text-xs text-muted-foreground">
          Try refreshing or check your connection
        </p>
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-background gap-0">
      {/* Left Sidebar - Inventory Items */}
      <div className="w-80 border-r border-border bg-card flex flex-col">
        <div className="p-3 space-y-3 flex flex-col h-full">
          {/* Search Bar */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 h-8 text-sm"
              disabled={isSearching}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 animate-spin text-primary" />
            )}
          </div>

          {/* Refresh Button */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">
              Inventory Items
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadInitialItems}
              disabled={isLoading}
              className="h-6 w-6 p-0"
            >
              <RefreshCw
                className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {/* Inventory Items */}
          <div className="flex-1 overflow-y-auto">{renderInventoryItems()}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="border-b border-border p-3 bg-card flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-foreground" />
              <h1 className="text-sm font-bold text-foreground">
                Point of Sale
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {cart.length} items
              </Badge>
              {cart.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  className="h-7 text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
              {renderBluetoothControls()}
              {lastTransaction && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrintReceipt(lastTransaction)}
                  disabled={isPrinting}
                  className="h-7 text-xs"
                >
                  <Printer className="h-3 w-3 mr-1" />
                  {isPrinting ? "Printing..." : "Print"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Container - Order Section */}
        <div className="flex-1 flex flex-col min-h-0 p-3">
          <div className="flex-1 flex flex-col min-h-0 border border-border rounded-lg">
            {/* Items Header - Always Visible */}
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border bg-muted/50 flex-shrink-0">
              <div className="col-span-1">QTY</div>
              <div className="col-span-5">PRODUCT</div>
              <div className="col-span-3">PRICE</div>
              <div className="col-span-3">ACTION</div>
            </div>

            {/* Scrollable Items Area */}
            <div
              className="flex-1 overflow-y-auto min-h-0"
              style={{ maxHeight: "calc(100vh - 420px)" }}
            >
              {cart.length > 0 ? (
                <div className="space-y-0">
                  {cart.map((item) => (
                    <div
                      key={item.product_id}
                      className="grid grid-cols-12 gap-2 px-3 py-2 items-center text-xs hover:bg-muted/50 transition-colors border-b border-border/50"
                    >
                      {/* Qty */}
                      <div className="col-span-1 font-medium">
                        {item.quantity}
                      </div>

                      {/* Product Name */}
                      <div className="col-span-5">
                        <h4 className="font-medium text-foreground truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {item.unit}
                        </p>
                      </div>

                      {/* Sale Price */}
                      <div className="col-span-3">
                        <span className="font-semibold text-foreground">
                          ₱{item.unitPrice.toFixed(2)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-3 flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            updateCartQuantity(
                              item.product_id,
                              item.quantity - 1
                            )
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            updateCartQuantity(
                              item.product_id,
                              item.quantity + 1
                            )
                          }
                          disabled={item.quantity >= item.availableQuantity}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={() => removeFromCart(item.product_id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">
                    No items in cart
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Add items from the sidebar
                  </p>
                </div>
              )}
            </div>

            {/* Fixed Bottom Section - ALWAYS VISIBLE */}
            <div className="border-t border-border bg-background p-3 space-y-2 flex-shrink-0">
              {/* Subtotal - ALWAYS VISIBLE */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">₱{subtotal.toFixed(2)}</span>
              </div>

              {/* Total - ALWAYS VISIBLE */}
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-foreground">
                  Total:
                </span>
                <span className="text-xl font-bold text-primary">
                  ₱{totalAmount.toFixed(2)}
                </span>
              </div>

              {/* Confirm Payment Button - ALWAYS VISIBLE but disabled when no items */}
              <Button
                onClick={() => setShowPaymentModal(true)}
                disabled={isProcessing || cart.length === 0}
                className="w-full h-10 text-base font-semibold mt-2"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirm Payment"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="max-w-sm w-full">
            <DialogHeader className="pb-2">
              <DialogTitle>Payment</DialogTitle>
              <DialogDescription className="text-xs">
                Enter amount and apply discount
              </DialogDescription>
            </DialogHeader>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="payment" className="text-xs">
                  Payment
                </TabsTrigger>
                <TabsTrigger value="client" className="text-xs">
                  Client Info
                </TabsTrigger>
              </TabsList>

              {/* Payment Tab */}
              <TabsContent value="payment" className="space-y-3">
                {/* Amount Breakdown */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>₱{subtotal.toFixed(2)}</span>
                  </div>
                  {/* Discount Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-muted-foreground whitespace-nowrap">
                      Discount:
                    </span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={discountPercentage}
                      onChange={(e) =>
                        setDiscountPercentage(parseFloat(e.target.value) || 0)
                      }
                      className="h-7 text-xs"
                      min="0"
                      max="100"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                  {discountPercentage > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount Amount:</span>
                      <span>-₱{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-sm font-bold">
                    <span>Total Amount:</span>
                    <span>₱{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                {/* Amount Due */}
                <div className="text-center p-2 bg-muted rounded">
                  <div className="text-xs text-muted-foreground mb-1">
                    Amount Due
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    ₱{totalAmount.toFixed(2)}
                  </div>
                </div>
                {/* Amount Received & Change Side by Side */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="text-xs text-muted-foreground mb-0.5">
                      Received
                    </div>
                    <div className="text-xl font-bold text-blue-600">
                      ₱{paymentAmount.toFixed(2)}
                    </div>
                  </div>
                  <div
                    className={`text-center p-2 rounded border ${
                      change >= 0
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="text-xs text-muted-foreground mb-0.5">
                      {change >= 0 ? "Change" : "Short"}
                    </div>
                    <div
                      className={`text-xl font-bold ${
                        change >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {change >= 0 ? "₱" : "-₱"}
                      {Math.abs(change).toFixed(2)}
                    </div>
                  </div>
                </div>
                {/* Numpad */}
                <div className="space-y-1">
                  <div className="grid grid-cols-3 gap-1">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(
                      (num) => (
                        <Button
                          key={num}
                          onClick={() => handleNumpadClick(num)}
                          variant="outline"
                          className="h-8 text-sm font-semibold"
                        >
                          {num}
                        </Button>
                      )
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      onClick={() => handleNumpadClick("0")}
                      variant="outline"
                      className="h-8 text-sm font-semibold"
                    >
                      0
                    </Button>
                    <Button
                      onClick={() => handleNumpadClick(".")}
                      variant="outline"
                      className="h-8 text-sm font-semibold"
                    >
                      .
                    </Button>
                    <Button
                      onClick={() => handleNumpadClick("←")}
                      variant="outline"
                      className="h-8 text-sm font-semibold text-destructive"
                    >
                      ←
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Client Info Tab */}
              <TabsContent value="client" className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Name
                  </label>
                  <Input
                    placeholder="Client Name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Phone
                  </label>
                  <Input
                    placeholder="Phone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Address
                  </label>
                  <Input
                    placeholder="Address"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2 pt-2">
              <Button
                onClick={() => handleNumpadClick("C")}
                variant="outline"
                className="flex-1 h-8 text-xs"
              >
                Clear
              </Button>
              <Button
                onClick={handlePaymentConfirm}
                disabled={paymentAmount < totalAmount}
                className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700"
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
