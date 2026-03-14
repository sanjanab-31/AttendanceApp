/**
 * Salary Calculation Rules
 * 
 * Shift Salary = Shift Hours × Hourly Rate
 * OT Salary = OT Hours × Hourly Rate
 * Total Salary = Shift Salary + OT Salary
 * 
 * Bonus is calculated ONLY using total shift hours.
 * OT hours must not be included in bonus calculation.
 */

export const calculateSalaryBreakdown = (
  shiftHours: number,
  otHours: number,
  hourlyRate: number
) => {
  const shiftSalary = shiftHours * hourlyRate;
  const otSalary = otHours * hourlyRate;
  const totalSalary = shiftSalary + otSalary;

  return {
    shiftSalary,
    otSalary,
    totalSalary,
  };
};

export const calculateTotalShiftHours = (attendanceRecords: any[]) => {
  return attendanceRecords.reduce((acc, record) => acc + (record.shiftHours || 0), 0);
};

export const calculateTotalOTHours = (attendanceRecords: any[]) => {
  return attendanceRecords.reduce((acc, record) => acc + (record.otHours || 0), 0);
};

export const formatCurrency = (amount: number) => {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `₹${safeAmount.toLocaleString('en-IN')}`;
};
