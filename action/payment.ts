"use server";

import dbConnect from "../lib/db";
import Payment from "../models/Payment";
import { getUsers } from "./userManagement";
import { PaymentData, PaymentStatus } from "@/types/payment";

export async function createPayment(
  paymentData: Omit<PaymentData, "id" | "createdAt" | "updatedAt">
) {
  try {
    await dbConnect();

    const payment = await Payment.create({
      payment_id: `pay_${Date.now()}`,
      referenceNumber: paymentData.referenceNumber,
      userId: paymentData.userInfo.userId,
      userFirstName: paymentData.userInfo.firstName,
      userLastName: paymentData.userInfo.lastName,
      userEmail: paymentData.userInfo.email,
      userPhone: paymentData.userInfo.contactNo,
      userAddress: paymentData.userInfo.address,
      amount: paymentData.amount,
      paymentType: paymentData.paymentType,
      paymentMethod: paymentData.paymentMethod,
      status: paymentData.status,
      designId: paymentData.designDetails.designId,
      designName: paymentData.designDetails.name,
      designPrice: paymentData.designDetails.price,
      squareMeters: paymentData.designDetails.squareMeters,
      isLoanOffer: paymentData.designDetails.isLoanOffer,
      loanDetails: paymentData.designDetails.loanDetails,
      transactionDate: new Date(paymentData.transactionDate),
      dueDate: paymentData.dueDate ? new Date(paymentData.dueDate) : undefined,
      notes: paymentData.notes,
    });

    return {
      success: true,
      payment: {
        id: payment.payment_id,
        referenceNumber: payment.referenceNumber,
        userInfo: {
          userId: payment.userId,
          firstName: payment.userFirstName,
          lastName: payment.userLastName,
          email: payment.userEmail,
          contactNo: payment.userPhone,
          address: payment.userAddress,
        },
        amount: payment.amount,
        paymentType: payment.paymentType,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        designDetails: {
          designId: payment.designId,
          name: payment.designName,
          price: payment.designPrice,
          squareMeters: payment.squareMeters,
          isLoanOffer: payment.isLoanOffer,
          loanDetails: payment.loanDetails,
        },
        transactionDate: payment.transactionDate.toISOString(),
        dueDate: payment.dueDate?.toISOString(),
        notes: payment.notes,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return {
      success: false,
      error: error.message || "Failed to create payment",
    };
  }
}

export async function getPayments() {
  try {
    await dbConnect();
    const payments = await Payment.find()
      .sort({ transactionDate: -1 })
      .lean()
      .exec();

    return {
      success: true,
      payments: payments.map((payment) => ({
        id: payment.payment_id,
        referenceNumber: payment.referenceNumber,
        userInfo: {
          userId: payment.userId,
          firstName: payment.userFirstName,
          lastName: payment.userLastName,
          email: payment.userEmail,
          contactNo: payment.userPhone,
          address: payment.userAddress,
        },
        amount: payment.amount,
        paymentType: payment.paymentType,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        designDetails: {
          designId: payment.designId,
          name: payment.designName,
          price: payment.designPrice,
          squareMeters: payment.squareMeters,
          isLoanOffer: payment.isLoanOffer,
          loanDetails: payment.loanDetails,
        },
        transactionDate: payment.transactionDate.toISOString(),
        dueDate: payment.dueDate?.toISOString(),
        notes: payment.notes,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch payments",
    };
  }
}

export async function getUsersForPOS() {
  try {
    const result = await getUsers();

    if (!result.success || !result.users) {
      return {
        success: false,
        error: result.error || "No users found",
        users: [],
      };
    }

    const users = result.users.map((user) => ({
      userId: user.user_id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNo: user.contactNo || "",
      address: user.address,
    }));

    return {
      success: true,
      users,
    };
  } catch (error: any) {
    console.error("Error fetching users for POS:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch users",
      users: [],
    };
  }
}
