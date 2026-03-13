import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useData } from "@/src/context/DataContext";
import { useToast } from "@/src/context/ToastContext";
import { formatCurrency } from "@/src/utils/salary";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PeriodType = "weekly" | "monthly" | "custom";

type DateRange = {
  from: Date;
  to: Date;
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  title: {
    fontSize: 25,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  sectionLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  periodCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  segmentActive: { backgroundColor: "#0f172a" },
  segmentText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  segmentTextActive: { color: "#ffffff" },
  dateRow: { flexDirection: "row", marginTop: 10 },
  dateBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#f8fafc",
  },
  dateGap: { width: 8 },
  dateLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  dateText: { color: "#0f172a", fontSize: 12, fontWeight: "600" },
  chipRow: { minHeight: 54, marginBottom: 10 },
  chip: {
    marginRight: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    minHeight: 42,
    justifyContent: "center",
  },
  chipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  chipText: { color: "#334155", fontWeight: "600", fontSize: 12 },
  chipTextActive: { color: "#ffffff" },
  warningBanner: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  warningText: { color: "#c2410c", fontSize: 12, fontWeight: "600" },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    marginBottom: 10,
  },
  summaryName: { color: "#0f172a", fontSize: 18, fontWeight: "700" },
  summaryPeriod: {
    color: "#64748b",
    marginTop: 2,
    marginBottom: 10,
    fontSize: 12,
  },
  block: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  blockHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  blockTitle: {
    marginLeft: 6,
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "700",
  },
  kv: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  kvLabel: { color: "#64748b", fontSize: 12 },
  kvValue: { color: "#1e293b", fontSize: 12, fontWeight: "600" },
  totalBlock: { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" },
  totalValue: { color: "#059669", fontSize: 30, fontWeight: "800" },
  statusCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  statusHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  statusTitle: { color: "#0f172a", fontWeight: "700", marginLeft: 6 },
  statusPaid: { color: "#059669", fontWeight: "700" },
  statusUnpaid: { color: "#ea580c", fontWeight: "700" },
  primaryBtn: {
    backgroundColor: "#0f766e",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryText: { color: "#ffffff", fontWeight: "700" },
  secondaryBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  secondaryText: { color: "#334155", fontWeight: "700" },
});

export default function SalarySummary() {
  const { employees, attendance, bonuses, salaryPayments, markSalaryPaid } =
    useData();
  const { showToast } = useToast();
  const router = useRouter();

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
    : "Select valid From and To dates";

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

  const segmentSummaries = unpaidSegments.map((segment) => {
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
  });

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
      ? "All Employees"
      : selectedEmployee?.name || "Employee";

  const warningMessage =
    overlappingPaidRanges.length > 0
      ? "Salary for part of this period has already been paid. Calculating only remaining unpaid dates."
      : "";

  const handleMarkAsPaid = async () => {
    if (!selectedRange) {
      showToast("Please choose a valid salary period.", "error");
      return;
    }

    if (!selectedEmployee || selectedEmployeeId === "all") {
      showToast("Choose an employee before marking salary as paid.", "error");
      return;
    }

    if (duplicateExactRange) {
      showToast("Salary for this exact date range is already paid.", "error");
      return;
    }

    if (unpaidSegments.length === 0) {
      showToast("Salary for this entire period is already paid.", "error");
      return;
    }

    const payableRows = segmentSummaries.filter((row) => row.totalSalary > 0);
    if (!payableRows.length) {
      showToast("No unpaid salary amount found for selected period.", "error");
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

      showToast("Salary marked as paid successfully", "success");
      setConfirmPaymentVisible(false);
    } catch (error: any) {
      showToast(error?.message || "Unable to mark salary as paid.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Salary Summary</Text>

        <View style={styles.periodCard}>
          <Text style={styles.sectionLabel}>Salary Period</Text>
          <View style={styles.segmented}>
            {[
              { key: "weekly", label: "Weekly" },
              { key: "monthly", label: "Monthly" },
              { key: "custom", label: "Custom" },
            ].map((periodOption) => {
              const active = periodType === periodOption.key;
              return (
                <Pressable
                  key={periodOption.key}
                  onPress={() => setPeriodType(periodOption.key as PeriodType)}
                  style={[
                    styles.segmentButton,
                    active ? styles.segmentActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      active ? styles.segmentTextActive : null,
                    ]}
                  >
                    {periodOption.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {periodType === "custom" ? (
            <View style={styles.dateRow}>
              <Pressable
                style={styles.dateBox}
                onPress={() => setShowFromPicker(true)}
              >
                <Text style={styles.dateLabel}>From Date</Text>
                <Text style={styles.dateText}>
                  {formatDateLabel(customFromDate)}
                </Text>
              </Pressable>
              <View style={styles.dateGap} />
              <Pressable
                style={styles.dateBox}
                onPress={() => setShowToPicker(true)}
              >
                <Text style={styles.dateLabel}>To Date</Text>
                <Text style={styles.dateText}>
                  {formatDateLabel(customToDate)}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionLabel}>Employee Filter</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
        >
          <Pressable
            onPress={() => setSelectedEmployeeId("all")}
            style={[
              styles.chip,
              selectedEmployeeId === "all" ? styles.chipActive : null,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selectedEmployeeId === "all" ? styles.chipTextActive : null,
              ]}
            >
              All Employees
            </Text>
          </Pressable>

          {employees.map((employee: any) => {
            const active = selectedEmployeeId === employee.id;
            return (
              <Pressable
                key={employee.id}
                onPress={() => setSelectedEmployeeId(employee.id)}
                style={[styles.chip, active ? styles.chipActive : null]}
              >
                <Text
                  style={[
                    styles.chipText,
                    active ? styles.chipTextActive : null,
                  ]}
                >
                  {employee.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {warningMessage ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{warningMessage}</Text>
          </View>
        ) : null}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View style={styles.summaryCard}>
            <Text style={styles.summaryName}>{selectedEmployeeName}</Text>
            <Text style={styles.summaryPeriod}>{periodLabel}</Text>

            <View style={styles.block}>
              <View style={styles.blockHeader}>
                <TabBarIcon name="time-outline" color="#334155" size={17} />
                <Text style={styles.blockTitle}>Work Summary</Text>
              </View>
              <View style={styles.kv}>
                <Text style={styles.kvLabel}>Shift Hours</Text>
                <Text style={styles.kvValue}>{totalShiftHours}h</Text>
              </View>
              <View style={styles.kv}>
                <Text style={styles.kvLabel}>OT Hours</Text>
                <Text style={styles.kvValue}>{totalOTHours}h</Text>
              </View>
            </View>

            <View style={styles.block}>
              <View style={styles.blockHeader}>
                <TabBarIcon name="wallet-outline" color="#334155" size={17} />
                <Text style={styles.blockTitle}>Salary Breakdown</Text>
              </View>
              <View style={styles.kv}>
                <Text style={styles.kvLabel}>Shift Salary</Text>
                <Text style={styles.kvValue}>
                  {formatCurrency(totalShiftSalary)}
                </Text>
              </View>
              <View style={styles.kv}>
                <Text style={styles.kvLabel}>OT Salary</Text>
                <Text style={styles.kvValue}>
                  {formatCurrency(totalOTSalary)}
                </Text>
              </View>
              <View style={styles.kv}>
                <Text style={styles.kvLabel}>Bonus</Text>
                <Text style={styles.kvValue}>{formatCurrency(totalBonus)}</Text>
              </View>
            </View>

            <View style={[styles.block, styles.totalBlock]}>
              <View style={styles.blockHeader}>
                <TabBarIcon name="cash-outline" color="#065f46" size={18} />
                <Text style={[styles.blockTitle, { color: "#065f46" }]}>
                  Total Net Salary
                </Text>
              </View>
              <Text style={styles.totalValue}>
                {formatCurrency(totalNetSalary)}
              </Text>
            </View>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <TabBarIcon
                name={
                  isFullyPaid
                    ? "checkmark-circle-outline"
                    : "alert-circle-outline"
                }
                color={isFullyPaid ? "#059669" : "#ea580c"}
                size={18}
              />
              <Text style={styles.statusTitle}>Salary Status</Text>
            </View>

            {isFullyPaid && latestPaymentDate ? (
              <Text style={styles.statusPaid}>
                Paid on {formatDateLabel(latestPaymentDate)}
              </Text>
            ) : (
              <Text style={styles.statusUnpaid}>Unpaid</Text>
            )}
          </View>

          <Pressable
            onPress={handleMarkAsPaid}
            disabled={saving || isFullyPaid || selectedEmployeeId === "all"}
            style={[
              styles.primaryBtn,
              saving || isFullyPaid || selectedEmployeeId === "all"
                ? styles.primaryBtnDisabled
                : null,
            ]}
          >
            <Text style={styles.primaryText}>
              {isFullyPaid
                ? "Already Paid"
                : saving
                  ? "Saving..."
                  : "Mark as Paid"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(owner)/salary-payments")}
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryText}>View Payment History</Text>
          </Pressable>
        </ScrollView>
      </View>

      {showFromPicker ? (
        <DateTimePicker
          value={customFromDate}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(_, value) => {
            if (Platform.OS === "android") setShowFromPicker(false);
            if (!value) return;
            setCustomFromDate(toDayStart(value));
          }}
        />
      ) : null}

      {showToPicker ? (
        <DateTimePicker
          value={customToDate}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(_, value) => {
            if (Platform.OS === "android") setShowToPicker(false);
            if (!value) return;
            setCustomToDate(toDayEnd(value));
          }}
        />
      ) : null}

      <ConfirmDialog
        visible={confirmPaymentVisible}
        title="Confirm Salary Payment"
        message="Are you sure you want to mark this salary period as paid?"
        confirmText="Confirm"
        variant="update"
        loading={saving}
        onCancel={() => {
          if (!saving) setConfirmPaymentVisible(false);
        }}
        onConfirm={confirmMarkAsPaid}
      />
    </SafeAreaView>
  );
}
