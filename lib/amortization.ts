export interface PaymentSchedule {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface LoanCalculation {
  principal: number;
  downpayment: number;
  totalPrice: number;
  loanAmount: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  schedule: PaymentSchedule[];
}

export function calculatePaymentSchedule(
  totalPrice: number,
  downpayment: number,
  maxLoanTerm: number,
  interestRate: number,
  interestRateType: "monthly" | "yearly" = "yearly",
  loanTermType: "months" | "years" = "years"
): LoanCalculation {
  // Validate inputs
  if (!totalPrice || totalPrice <= 0) {
    console.warn("Invalid total price:", totalPrice);
    return getEmptyCalculation(totalPrice, downpayment);
  }
  if (downpayment < 0 || downpayment > totalPrice) {
    console.warn("Invalid downpayment amount:", downpayment);
    return getEmptyCalculation(totalPrice, downpayment);
  }
  if (!maxLoanTerm || maxLoanTerm <= 0) {
    console.warn("Invalid loan term:", maxLoanTerm);
    return getEmptyCalculation(totalPrice, downpayment);
  }
  if (!interestRate || interestRate < 0) {
    console.warn("Invalid interest rate:", interestRate);
    return getEmptyCalculation(totalPrice, downpayment);
  }

  // Calculate loan amount (principal)
  const loanAmount = totalPrice - downpayment;

  if (loanAmount <= 0) {
    console.warn("Loan amount is zero or negative after downpayment");
    return getEmptyCalculation(totalPrice, downpayment, loanAmount);
  }

  // Convert term to months if it's in years
  const numberOfMonths =
    loanTermType === "years" ? maxLoanTerm * 12 : maxLoanTerm;

  console.log("Loan calculation details:", {
    totalPrice,
    downpayment,
    loanAmount,
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
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths))) /
    (Math.pow(1 + monthlyRate, numberOfMonths) - 1);

  console.log("Monthly payment:", monthlyPayment);

  if (isNaN(monthlyPayment) || monthlyPayment <= 0) {
    console.warn("Invalid monthly payment calculation");
    return getEmptyCalculation(totalPrice, downpayment, loanAmount);
  }

  const schedule: PaymentSchedule[] = [];
  let balance = loanAmount;
  let totalInterest = 0;

  for (let month = 1; month <= numberOfMonths; month++) {
    const interest = balance * monthlyRate;
    const principalPayment = monthlyPayment - interest;
    balance -= principalPayment;
    totalInterest += interest;

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

  const totalPayment = loanAmount + totalInterest;

  return {
    principal: loanAmount,
    downpayment,
    totalPrice,
    loanAmount,
    monthlyPayment,
    totalInterest,
    totalPayment,
    schedule,
  };
}

// Helper function for empty/invalid calculations
function getEmptyCalculation(
  totalPrice: number,
  downpayment: number,
  loanAmount: number = 0
): LoanCalculation {
  return {
    principal: loanAmount,
    downpayment,
    totalPrice,
    loanAmount,
    monthlyPayment: 0,
    totalInterest: 0,
    totalPayment: loanAmount,
    schedule: [],
  };
}

export function formatCurrency(amount: number): string {
  return `₱${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

// New function to calculate downpayment percentage
export function calculateDownpaymentPercentage(
  totalPrice: number,
  downpayment: number
): number {
  if (!totalPrice || totalPrice <= 0) return 0;
  return (downpayment / totalPrice) * 100;
}

// New function to get recommended downpayment options
export function getRecommendedDownpayments(totalPrice: number): number[] {
  const percentages = [0.1, 0.2, 0.3, 0.4, 0.5]; // 10%, 20%, 30%, 40%, 50%
  return percentages.map((percent) => totalPrice * percent);
}

// New function to calculate affordability
export function calculateAffordability(
  monthlyIncome: number,
  debtToIncomeRatio: number = 0.36 // Standard 36% DTI ratio
): number {
  return monthlyIncome * debtToIncomeRatio;
}

// New function to calculate loan-to-value ratio
export function calculateLTV(totalPrice: number, downpayment: number): number {
  if (!totalPrice || totalPrice <= 0) return 0;
  const loanAmount = totalPrice - downpayment;
  return (loanAmount / totalPrice) * 100;
}

// New function to generate multiple loan scenarios
export function generateLoanScenarios(
  totalPrice: number,
  downpayment: number,
  interestRate: number,
  interestRateType: "monthly" | "yearly" = "yearly"
): Array<{
  term: number;
  termType: "years";
  calculation: LoanCalculation;
}> {
  const terms = [5, 10, 15, 20, 25, 30]; // Common loan terms in years

  return terms.map((term) => ({
    term,
    termType: "years",
    calculation: calculatePaymentSchedule(
      totalPrice,
      downpayment,
      term,
      interestRate,
      interestRateType,
      "years"
    ),
  }));
}

// New function to calculate early payoff
export function calculateEarlyPayoff(
  calculation: LoanCalculation,
  extraPayment: number,
  startMonth: number = 1
): {
  originalTerm: number;
  newTerm: number;
  interestSaved: number;
  monthsSaved: number;
} {
  const schedule = calculation.schedule;
  if (schedule.length === 0) {
    return {
      originalTerm: 0,
      newTerm: 0,
      interestSaved: 0,
      monthsSaved: 0,
    };
  }

  let balance = calculation.loanAmount;
  let totalInterest = 0;
  let month = 0;

  while (balance > 0 && month < schedule.length * 2) {
    // Prevent infinite loop
    const monthlyData = schedule[month] || {
      payment: calculation.monthlyPayment,
      principal: 0,
      interest:
        balance *
        (calculation.schedule[0]?.interest / calculation.schedule[0]?.balance ||
          0),
      balance,
    };

    const effectivePayment =
      monthlyData.payment + (month >= startMonth - 1 ? extraPayment : 0);

    const interest = monthlyData.interest;
    const principalPayment = Math.min(effectivePayment - interest, balance);

    balance -= principalPayment;
    totalInterest += interest;
    month++;

    if (balance <= 0) break;
  }

  const originalTerm = schedule.length;
  const newTerm = month;
  const interestSaved = calculation.totalInterest - totalInterest;

  return {
    originalTerm,
    newTerm,
    interestSaved,
    monthsSaved: Math.max(originalTerm - newTerm, 0),
  };
}
