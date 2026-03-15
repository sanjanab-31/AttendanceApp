import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useData } from "@/src/context/DataContext";
import { useToast } from "@/src/context/ToastContext";
import { formatCurrency } from "@/src/utils/salary";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PeriodType = "weekly" | "monthly" | "custom";

type DateRange = {
  from: Date;
  to: Date;
};

type SalaryRecordSummary = {
  segment: DateRange;
  shiftHours: number;
  otHours: number;
  shiftSalary: number;
  otSalary: number;
  bonusAmount: number;
  totalSalary: number;
};

const parseDate = (value: any) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return parsedDate;
};

const toDayStart = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);

const toDayEnd = (value: Date) =>
  new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    23,
    59,
    59,
    999,
  );

const toDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (value: Date) =>
  value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const toNumber = (value: any) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isWithinRange = (target: Date, start: Date, end: Date) => {
  const targetMs = target.getTime();
  return targetMs >= start.getTime() && targetMs <= end.getTime();
};

const rangesOverlap = (left: DateRange, right: DateRange) =>
  left.from.getTime() <= right.to.getTime() &&
  right.from.getTime() <= left.to.getTime();

const mergeRanges = (ranges: DateRange[]) => {
  const sortedRanges = [...ranges]
    .map((range) => ({ from: toDayStart(range.from), to: toDayEnd(range.to) }))
    .sort((left, right) => left.from.getTime() - right.from.getTime());

  if (!sortedRanges.length) return [] as DateRange[];

  const mergedRanges: DateRange[] = [sortedRanges[0]];

  for (let i = 1; i < sortedRanges.length; i += 1) {
    const currentRange = sortedRanges[i];
    const lastRange = mergedRanges[mergedRanges.length - 1];

    if (currentRange.from.getTime() <= lastRange.to.getTime() + 1) {
      if (currentRange.to.getTime() > lastRange.to.getTime()) {
        lastRange.to = currentRange.to;
      }
    } else {
      mergedRanges.push(currentRange);
    }
  }

  return mergedRanges;
};

const subtractRanges = (baseRange: DateRange, blockedRanges: DateRange[]) => {
  if (!blockedRanges.length) return [baseRange];

  const resultRanges: DateRange[] = [];
  let cursor = baseRange.from.getTime();
  const endTime = baseRange.to.getTime();

  for (const blockedRange of blockedRanges) {
    const blockedStart = Math.max(
      blockedRange.from.getTime(),
      baseRange.from.getTime(),
    );
    const blockedEnd = Math.min(
      blockedRange.to.getTime(),
      baseRange.to.getTime(),
    );

    if (blockedEnd < cursor || blockedStart > endTime) {
      continue;
    }

    if (blockedStart > cursor) {
      resultRanges.push({
        from: new Date(cursor),
        to: new Date(blockedStart - 1),
      });
    }

    cursor = Math.max(cursor, blockedEnd + 1);
    if (cursor > endTime) break;
  }

  if (cursor <= endTime) {
    resultRanges.push({ from: new Date(cursor), to: new Date(endTime) });
  }

  return resultRanges.filter(
    (range) => range.from.getTime() <= range.to.getTime(),
  );
};

export default function SalarySummary() {
  const { employees, attendance, bonuses, salaryPayments, markSalaryPaid } =
    useData();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("all");
  const [customFromDate, setCustomFromDate] = useState(() =>
    toDayStart(new Date()),
  );
  const [customToDate, setCustomToDate] = useState(() => toDayEnd(new Date()));
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [confirmPaymentVisible, setConfirmPaymentVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const valid =
      selectedEmployeeId === "all" ||
      employees.some((employee: any) => employee.id === selectedEmployeeId);
    if (!valid) setSelectedEmployeeId("all");
  }, [employees, selectedEmployeeId]);

  const selectedEmployee =
    employees.find((employee: any) => employee.id === selectedEmployeeId) ||
    null;

  const selectedRange = useMemo(() => {
    const today = new Date();

    if (periodType === "weekly") {
      const end = toDayEnd(today);
      const start = toDayStart(today);
      const day = start.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - diffToMonday);
      return { from: toDayStart(start), to: end };
    }

    if (periodType === "monthly") {
      const start = new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
        0,
        0,
        0,
        0,
      );
      const end = toDayEnd(today);
      return { from: start, to: end };
    }

    if (customFromDate.getTime() > customToDate.getTime()) return null;
    return { from: toDayStart(customFromDate), to: toDayEnd(customToDate) };
  }, [periodType, customFromDate, customToDate]);

  const selectedEmployeeKeys =
    selectedEmployeeId === "all"
      ? employees.map((employee: any) => employee.employeeId).filter(Boolean)
      : [selectedEmployee?.employeeId].filter(Boolean);

  const periodFromDateKey = selectedRange ? toDateKey(selectedRange.from) : "";
  const periodToDateKey = selectedRange ? toDateKey(selectedRange.to) : "";

  const periodLabel = selectedRange
    ? `${formatDateLabel(selectedRange.from)} - ${formatDateLabel(selectedRange.to)}`
    : "Invalid Range Selected";

  const employeePaidRanges = useMemo(() => {
    if (!selectedEmployee?.employeeId) return [] as DateRange[];

    const ranges = salaryPayments
      .filter((payment: any) => {
        const status = String(payment.paymentStatus || "").toLowerCase();
        return (
          payment.employeeId === selectedEmployee.employeeId &&
          status === "paid"
        );
      })
      .map((payment: any) => {
        const fromDate = parseDate(payment.fromDate);
        const toDate = parseDate(payment.toDate);
        if (!fromDate || !toDate) return null;
        return { from: toDayStart(fromDate), to: toDayEnd(toDate) };
      })
      .filter(Boolean) as DateRange[];

    return mergeRanges(ranges);
  }, [salaryPayments, selectedEmployee]);

  const duplicateExactRange =
    !!selectedRange &&
    employeePaidRanges.some(
      (range) =>
        toDateKey(range.from) === periodFromDateKey &&
        toDateKey(range.to) === periodToDateKey,
    );

  const overlappingPaidRanges =
    selectedRange && selectedEmployee
      ? employeePaidRanges.filter((range) =>
          rangesOverlap(selectedRange, range),
        )
      : [];

  const unpaidSegments =
    selectedRange && selectedEmployee
      ? subtractRanges(selectedRange, overlappingPaidRanges)
      : selectedRange
        ? [selectedRange]
        : [];

  const segmentSummaries: SalaryRecordSummary[] = unpaidSegments.map(
    (segment) => {
      const segmentAttendance = attendance.filter((record: any) => {
        if (!selectedEmployeeKeys.includes(record.employeeId)) return false;
        const recordDate = parseDate(record.date);
        return recordDate
          ? isWithinRange(recordDate, segment.from, segment.to)
          : false;
      });

      const segmentBonuses = bonuses.filter((bonus: any) => {
        if (!selectedEmployeeKeys.includes(bonus.employeeId)) return false;
        const bonusDate = parseDate(bonus.toDate);
        return bonusDate
          ? isWithinRange(bonusDate, segment.from, segment.to)
          : false;
      });

      const shiftHours = segmentAttendance.reduce(
        (acc: number, record: any) => acc + toNumber(record.shiftHours),
        0,
      );
      const otHours = segmentAttendance.reduce(
        (acc: number, record: any) => acc + toNumber(record.otHours),
        0,
      );
      const shiftSalary = segmentAttendance.reduce(
        (acc: number, record: any) => acc + toNumber(record.shiftSalary),
        0,
      );
      const otSalary = segmentAttendance.reduce(
        (acc: number, record: any) => acc + toNumber(record.otSalary),
        0,
      );
      const bonusAmount = segmentBonuses.reduce(
        (acc: number, bonus: any) => acc + toNumber(bonus.bonusAmount),
        0,
      );

      const totalSalary = shiftSalary + otSalary + bonusAmount;

      return {
        segment,
        shiftHours,
        otHours,
        shiftSalary,
        otSalary,
        bonusAmount,
        totalSalary,
      };
    },
  );

  const totalShiftHours = segmentSummaries.reduce(
    (acc, row) => acc + row.shiftHours,
    0,
  );
  const totalOTHours = segmentSummaries.reduce(
    (acc, row) => acc + row.otHours,
    0,
  );
  const totalShiftSalary = segmentSummaries.reduce(
    (acc, row) => acc + row.shiftSalary,
    0,
  );
  const totalOTSalary = segmentSummaries.reduce(
    (acc, row) => acc + row.otSalary,
    0,
  );
  const totalBonus = segmentSummaries.reduce(
    (acc, row) => acc + row.bonusAmount,
    0,
  );
  const totalNetSalary = segmentSummaries.reduce(
    (acc, row) => acc + row.totalSalary,
    0,
  );

  const isFullyPaid =
    !!selectedRange && !!selectedEmployee && unpaidSegments.length === 0;

  const latestPaymentDate = useMemo(() => {
    if (!selectedEmployee?.employeeId || !selectedRange) return null;

    const matching = salaryPayments
      .filter((payment: any) => {
        const status = String(payment.paymentStatus || "").toLowerCase();
        if (status !== "paid") return false;
        if (payment.employeeId !== selectedEmployee.employeeId) return false;

        const paymentFrom = parseDate(payment.fromDate);
        const paymentTo = parseDate(payment.toDate);
        if (!paymentFrom || !paymentTo) return false;

        return rangesOverlap(selectedRange, {
          from: toDayStart(paymentFrom),
          to: toDayEnd(paymentTo),
        });
      })
      .map((payment: any) => parseDate(payment.paymentDate))
      .filter(Boolean) as Date[];

    if (!matching.length) return null;
    matching.sort((a, b) => b.getTime() - a.getTime());
    return matching[0];
  }, [salaryPayments, selectedEmployee, selectedRange]);

  const selectedEmployeeName =
    selectedEmployeeId === "all"
      ? "Collective View"
      : selectedEmployee?.name || "Member";

  const warningMessage =
    overlappingPaidRanges.length > 0
      ? "Partial payments detected. Showing remaining balance."
      : "";

  const handleMarkAsPaid = async () => {
    if (!selectedRange) {
      showToast("Invalid period selection.", "error");
      return;
    }

    if (!selectedEmployee || selectedEmployeeId === "all") {
      showToast("Select a specific employee to issue payout.", "error");
      return;
    }

    if (duplicateExactRange) {
      showToast("This range has already been settled.", "success");
      return;
    }

    const payableRows = segmentSummaries.filter((row) => row.totalSalary > 0);
    if (!payableRows.length) {
      showToast("Zero balance for this period.", "success");
      return;
    }

    setConfirmPaymentVisible(true);
  };

  const confirmMarkAsPaid = async () => {
    if (!selectedEmployee || !selectedRange) {
      setConfirmPaymentVisible(false);
      return;
    }

    const payableRows = segmentSummaries.filter((row) => row.totalSalary > 0);

    setSaving(true);
    try {
      for (const row of payableRows) {
        await markSalaryPaid({
          employeeId: selectedEmployee.employeeId,
          employeeName: selectedEmployee.name,
          periodType,
          fromDate: toDateKey(row.segment.from),
          toDate: toDateKey(row.segment.to),
          paidAmount: row.totalSalary,
          totalSalary: row.totalSalary,
          paymentStatus: "paid",
        });
      }

      showToast("Salary payout confirmed", "success");
      setConfirmPaymentVisible(false);
    } catch (error: any) {
      showToast(error?.message || "Failed to confirm payout.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff", paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>
        <Text style={{ fontSize: 30, fontWeight: "900", color: "#0f172a", marginBottom: 24 }}>
          Payouts
        </Text>

        <View style={{ backgroundColor: "white", padding: 20, borderRadius: 24, borderWidth: 1, borderColor: "#f1f5f9", elevation: 2, marginBottom: 24 }}>
          <Text style={{ fontSize: 11, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
            Payout Cycle
          </Text>
          <View style={{ flexDirection: "row", backgroundColor: "#f8fafc", padding: 4, borderRadius: 16, marginBottom: 16 }}>
            {[
              { key: "weekly", label: "Weekly" },
              { key: "monthly", label: "Monthly" },
              { key: "custom", label: "Custom" },
            ].map((option) => {
              const active = periodType === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => setPeriodType(option.key as PeriodType)}
                  style={[{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center" }, active ? { backgroundColor: "white", elevation: 2 } : {}]}
                >
                  <Text
                    style={{ fontSize: 13, fontWeight: "bold", color: active ? "#4f46e5" : "#64748b" }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {periodType === "custom" && (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <TouchableOpacity
                onPress={() => setShowFromPicker(true)}
                style={{ flex: 1, backgroundColor: "#f8fafc", padding: 12, borderRadius: 16, borderWidth: 1, borderColor: "#f1f5f9", marginRight: 8 }}
              >
                <Text style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>
                  From
                </Text>
                <Text style={{ fontSize: 14, fontWeight: "bold", color: "#1e293b" }}>
                  {formatDateLabel(customFromDate)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowToPicker(true)}
                style={{ flex: 1, backgroundColor: "#f8fafc", padding: 12, borderRadius: 16, borderWidth: 1, borderColor: "#f1f5f9", marginLeft: 8 }}
              >
                <Text style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>
                  To
                </Text>
                <Text style={{ fontSize: 14, fontWeight: "bold", color: "#1e293b" }}>
                  {formatDateLabel(customToDate)}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {showFromPicker && (
            <DateTimePicker
              value={customFromDate}
              mode="date"
              display="default"
              onChange={(_event, date) => {
                setShowFromPicker(false);
                if (date) setCustomFromDate(toDayStart(date));
              }}
            />
          )}
          {showToPicker && (
            <DateTimePicker
              value={customToDate}
              mode="date"
              display="default"
              onChange={(_event, date) => {
                setShowToPicker(false);
                if (date) setCustomToDate(toDayEnd(date));
              }}
            />
          )}
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: "#64748b", fontWeight: "bold", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, marginLeft: 4 }}> Member</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
            <TouchableOpacity
              onPress={() => setSelectedEmployeeId("all")}
              style={{
                marginRight: 10,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 16,
                borderWidth: 1,
                backgroundColor: selectedEmployeeId === "all" ? "#4f46e5" : "white",
                borderColor: selectedEmployeeId === "all" ? "#4f46e5" : "#f1f5f9",
                elevation: selectedEmployeeId === "all" ? 4 : 0
              }}
            >
              <Text style={{ fontWeight: "bold", fontSize: 13, color: selectedEmployeeId === "all" ? "white" : "#475569" }}>
                Everyone
              </Text>
            </TouchableOpacity>
            {employees.map((employee: any) => {
              const active = selectedEmployeeId === employee.id;
              return (
                <TouchableOpacity
                  key={employee.id}
                  onPress={() => setSelectedEmployeeId(employee.id)}
                  style={{
                    marginRight: 10,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 16,
                    borderWidth: 1,
                    backgroundColor: active ? "#4f46e5" : "white",
                    borderColor: active ? "#4f46e5" : "#f1f5f9",
                    elevation: active ? 4 : 0
                  }}
                >
                  <Text style={{ fontWeight: "bold", fontSize: 13, color: active ? "white" : "#475569" }}>
                    {employee.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {warningMessage ? (
          <View style={{ backgroundColor: "#fffbeb", padding: 12, borderRadius: 16, borderWidth: 1, borderColor: "#fef3c7", marginBottom: 24, flexDirection: "row", alignItems: "center" }}>
            <TabBarIcon name="alert-circle" color="#b45309" size={16} />
            <Text style={{ color: "#b45309", fontSize: 12, fontWeight: "bold", marginLeft: 8, flex: 1 }}>
              {warningMessage}
            </Text>
          </View>
        ) : null}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          style={{ flex: 1 }}
        >
          <View style={{ backgroundColor: "white", padding: 24, borderRadius: 24, borderWidth: 1, borderColor: "#f1f5f9", elevation: 2, marginBottom: 24 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <View>
                <Text style={{ fontSize: 24, fontWeight: "900", color: "#0f172a" }}>
                  {selectedEmployeeName}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: "500", color: "#94a3b8", marginTop: 4 }}>
                  {periodLabel}
                </Text>
              </View>
              {isFullyPaid ? (
                <View style={{ backgroundColor: "#ecfdf5", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: "#d1fae5" }}>
                  <Text style={{ color: "#059669", fontWeight: "bold", fontSize: 11, textTransform: "uppercase" }}>
                    Settled
                  </Text>
                </View>
              ) : (
                <View style={{ backgroundColor: "#fff1f2", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: "#ffe4e6" }}>
                  <Text style={{ color: "#e11d48", fontWeight: "bold", fontSize: 11, textTransform: "uppercase" }}>
                    Unpaid
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
              <View>
                <Text style={{ fontSize: 11, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>
                  Work Effort
                </Text>
                <Text style={{ fontSize: 15, fontWeight: "bold", color: "#1e293b" }}>
                  {totalShiftHours + totalOTHours} Total Hours
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 11, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>
                  Shift / OT
                </Text>
                <Text style={{ fontSize: 14, fontWeight: "bold", color: "#1e293b" }}>
                  {totalShiftHours}h / {totalOTHours}h
                </Text>
              </View>
            </View>

            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={{ color: "#64748b", fontWeight: "500" }}>
                  Basic Earnings
                </Text>
                <Text style={{ color: "#0f172a", fontWeight: "bold" }}>
                  {formatCurrency(totalShiftSalary)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={{ color: "#64748b", fontWeight: "500" }}>
                  Overtime Bonus
                </Text>
                <Text style={{ color: "#0f172a", fontWeight: "bold" }}>
                  {formatCurrency(totalOTSalary)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#64748b", fontWeight: "500" }}>Incentives</Text>
                <Text style={{ color: "#059669", fontWeight: "bold" }}>
                  {formatCurrency(totalBonus)}
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: "#eef2ff", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "#e0e7ff", marginBottom: 24 }}>
              <Text style={{ color: "#4f46e5", fontWeight: "bold", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                Net Payout
              </Text>
              <Text style={{ fontSize: 32, fontWeight: "900", color: "#4338ca" }}>
                {formatCurrency(totalNetSalary)}
              </Text>
            </View>

            {isFullyPaid && latestPaymentDate ? (
              <View style={{ backgroundColor: "#f8fafc", padding: 16, borderRadius: 16, flexDirection: "row", alignItems: "center" }}>
                <TabBarIcon name="calendar" color="#64748b" size={16} />
                <Text style={{ color: "#64748b", fontSize: 13, fontWeight: "bold", marginLeft: 8 }}>
                  Payment released on {formatDateLabel(latestPaymentDate)}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleMarkAsPaid}
                disabled={
                  saving ||
                  isFullyPaid ||
                  selectedEmployeeId === "all" ||
                  totalNetSalary <= 0
                }
                style={[
                  { paddingVertical: 16, borderRadius: 16, alignItems: "center", elevation: 4 },
                  (saving || isFullyPaid || selectedEmployeeId === "all" || totalNetSalary <= 0)
                    ? { backgroundColor: "#e2e8f0" }
                    : { backgroundColor: "#4f46e5", shadowColor: "#4f46e5", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }
                ]}
              >
                <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
                  {saving
                    ? "Processing..."
                    : isFullyPaid
                      ? "Fully Settled"
                      : "Release Payout"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(owner)/salary-payments")}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#f1f5f9" }}
          >
            <TabBarIcon name="receipt-outline" color="#4f46e5" size={18} />
            <Text style={{ color: "#4f46e5", fontWeight: "bold", marginLeft: 8 }}>
              Transaction History
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ConfirmDialog
        visible={confirmPaymentVisible}
        title="Confirm Payout"
        message={`Are you sure you want to mark ${formatCurrency(totalNetSalary)} as paid for ${selectedEmployeeName}? This will cover the period from ${formatDateLabel(selectedRange?.from || new Date())} to ${formatDateLabel(selectedRange?.to || new Date())}.`}
        confirmText="Confirm"
        loading={saving}
        onCancel={() => setConfirmPaymentVisible(false)}
        onConfirm={confirmMarkAsPaid}
      />
    </View>
  );
}

