import UserTransactions from "@/components/user/transaction/UserTransaction";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Transactions",
  description: "View and manage all your payment transactions",
};

export default function TransactionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <UserTransactions />
    </div>
  );
}
