export interface PaymentSchedule {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export function calculatePaymentSchedule(
  principal: number,
  maxLoanYears: number,
  interestRate: number
): PaymentSchedule[] {
  if (!principal || !maxLoanYears || !interestRate) {
    return [];
  }

  const annualRate = interestRate / 100;
  const monthlyRate = annualRate / 12;
  const numberOfMonths = maxLoanYears * 12;

  // Calculate monthly payment
  const monthlyPayment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths))) /
    (Math.pow(1 + monthlyRate, numberOfMonths) - 1);

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
  }

  return schedule;
}

export function formatCurrency(amount: number): string {
  return `₱${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}
