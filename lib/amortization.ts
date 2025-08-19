export interface PaymentSchedule {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export function calculatePaymentSchedule(
  principal: number,
  maxLoanTerm: number,
  interestRate: number,
  interestRateType: "monthly" | "yearly" = "yearly",
  loanTermType: "months" | "years" = "years"
): PaymentSchedule[] {
  // Validate inputs
  if (!principal || principal <= 0) {
    console.warn("Invalid principal amount:", principal);
    return [];
  }
  if (!maxLoanTerm || maxLoanTerm <= 0) {
    console.warn("Invalid loan term:", maxLoanTerm);
    return [];
  }
  if (!interestRate || interestRate < 0) {
    console.warn("Invalid interest rate:", interestRate);
    return [];
  }

  // Convert term to months if it's in years
  const numberOfMonths =
    loanTermType === "years" ? maxLoanTerm * 12 : maxLoanTerm;

  console.log("Loan calculation details:", {
    principal,
    maxLoanTerm,
    loanTermType,
    numberOfMonths,
    interestRate,
    interestRateType,
  });

  // Convert interest rate to monthly rate
  const monthlyRate =
    interestRateType === "yearly"
      ? interestRate / 100 / 12
      : interestRate / 100;

  console.log("Monthly interest rate:", monthlyRate);

  // Calculate monthly payment using the amortization formula
  const monthlyPayment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths))) /
    (Math.pow(1 + monthlyRate, numberOfMonths) - 1);

  console.log("Monthly payment:", monthlyPayment);

  if (isNaN(monthlyPayment) || monthlyPayment <= 0) {
    console.warn("Invalid monthly payment calculation");
    return [];
  }

  const schedule: PaymentSchedule[] = [];
  let balance = principal;

  for (let month = 1; month <= numberOfMonths; month++) {
    const interest = balance * monthlyRate;
    const principalPayment = monthlyPayment - interest;
    balance -= principalPayment;

    schedule.push({
      month,
      payment: monthlyPayment,
      principal: principalPayment,
      interest,
      balance: Math.max(balance, 0), // Avoid negative balance due to rounding
    });

    // Stop if balance is zero or negative (due to rounding)
    if (balance <= 0) {
      break;
    }
  }

  return schedule;
}

export function formatCurrency(amount: number): string {
  return `₱${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}
