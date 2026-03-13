import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "../config/firebase";
import { useAuth } from "./AuthContext";

type AttendanceSaveResult = "created" | "updated";

interface DataContextType {
  employees: any[];
  attendance: any[];
  bonuses: any[];
  salaryPayments: any[];
  loading: boolean;
  addEmployee: (data: any) => Promise<void>;
  updateEmployee: (id: string, data: any) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  markAttendance: (data: any) => Promise<AttendanceSaveResult>;
  addBonus: (data: any) => Promise<void>;
  markSalaryPaid: (data: any) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAdmin, userData } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const toMillis = (value: any) => {
    if (!value) return 0;
    if (typeof value?.toMillis === "function") return value.toMillis();
    if (typeof value?.seconds === "number") return value.seconds * 1000;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const getDateKey = (value: any) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error("Invalid attendance date");
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const findAttendanceRecordByEmployeeAndDate = async (
    employeeId: string,
    dateKey: string,
  ) => {
    const attendanceSnapshot = await getDocs(
      query(
        collection(db, "attendance"),
        where("employeeId", "==", employeeId),
      ),
    );

    return attendanceSnapshot.docs
      .map((attendanceDoc) => ({
        id: attendanceDoc.id,
        ...attendanceDoc.data(),
      }))
      .find((record: any) => {
        const recordDateKey =
          record.dateKey || getDateKey(record.date?.toDate?.() || record.date);
        return recordDateKey === dateKey;
      });
  };

  useEffect(() => {
    if (!user) {
      setEmployees([]);
      setAttendance([]);
      setBonuses([]);
      setSalaryPayments([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Employees Collection
    const employeesQuery = isAdmin
      ? query(collection(db, "employees"), orderBy("name"))
      : query(collection(db, "employees"), where("email", "==", user.email));

    const unsubEmployees = onSnapshot(employeesQuery, (snapshot) => {
      setEmployees(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    // Attendance Collection
    const attendanceQuery = isAdmin
      ? query(collection(db, "attendance"), orderBy("date", "desc"))
      : query(
          collection(db, "attendance"),
          where("employeeId", "==", userData?.employeeId || ""),
        );

    const unsubAttendance = onSnapshot(
      attendanceQuery,
      (snapshot) => {
        const rows = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        if (isAdmin) {
          setAttendance(rows);
        } else {
          rows.sort((a: any, b: any) => toMillis(b.date) - toMillis(a.date));
          setAttendance(rows);
        }
      },
      () => {
        setAttendance([]);
      },
    );

    // Bonuses Collection
    const bonusesQuery = isAdmin
      ? query(collection(db, "bonuses"), orderBy("toDate", "desc"))
      : query(
          collection(db, "bonuses"),
          where("employeeId", "==", userData?.employeeId || ""),
        );

    const unsubBonuses = onSnapshot(
      bonusesQuery,
      (snapshot) => {
        const rows = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        if (isAdmin) {
          setBonuses(rows);
        } else {
          rows.sort(
            (a: any, b: any) => toMillis(b.toDate) - toMillis(a.toDate),
          );
          setBonuses(rows);
        }
        setLoading(false);
      },
      () => {
        setBonuses([]);
        setLoading(false);
      },
    );

    const salaryPaymentsQuery = isAdmin
      ? query(collection(db, "salaryPayments"), orderBy("paymentDate", "desc"))
      : query(
          collection(db, "salaryPayments"),
          where("employeeId", "==", userData?.employeeId || ""),
        );

    const unsubSalaryPayments = onSnapshot(
      salaryPaymentsQuery,
      (snapshot) => {
        const rows = snapshot.docs.map((paymentDoc) => ({
          id: paymentDoc.id,
          ...paymentDoc.data(),
        }));
        if (isAdmin) {
          setSalaryPayments(rows);
        } else {
          rows.sort(
            (a: any, b: any) =>
              toMillis(b.paymentDate) - toMillis(a.paymentDate),
          );
          setSalaryPayments(rows);
        }
        setLoading(false);
      },
      () => {
        setSalaryPayments([]);
        setLoading(false);
      },
    );

    return () => {
      unsubEmployees();
      unsubAttendance();
      unsubBonuses();
      unsubSalaryPayments();
    };
  }, [user, isAdmin, userData]);

  const addEmployee = async (data: any) => {
    await addDoc(collection(db, "employees"), {
      ...data,
      createdAt: Timestamp.now(),
    });
  };

  const updateEmployee = async (id: string, data: any) => {
    await updateDoc(doc(db, "employees", id), data);
  };

  const deleteEmployee = async (id: string) => {
    await deleteDoc(doc(db, "employees", id));
  };

  const markAttendance = async (data: any) => {
    const dateKey = getDateKey(data.date);
    const date = Timestamp.fromDate(new Date(`${dateKey}T00:00:00`));
    const payload = {
      ...data,
      date,
      dateKey,
      updatedAt: Timestamp.now(),
    };

    const existingRecord = await findAttendanceRecordByEmployeeAndDate(
      data.employeeId,
      dateKey,
    );

    if (existingRecord?.id) {
      await updateDoc(doc(db, "attendance", existingRecord.id), payload);
      return "updated";
    }

    const attendanceDocId = `${data.employeeId}_${dateKey}`;
    await setDoc(doc(db, "attendance", attendanceDocId), {
      ...payload,
      createdAt: Timestamp.now(),
    });
    return "created";
  };

  const addBonus = async (data: any) => {
    await addDoc(collection(db, "bonuses"), {
      ...data,
      fromDate: Timestamp.fromDate(new Date(data.fromDate)),
      toDate: Timestamp.fromDate(new Date(data.toDate)),
      createdAt: Timestamp.now(),
    });
  };

  const markSalaryPaid = async (data: any) => {
    await addDoc(collection(db, "salaryPayments"), {
      ...data,
      fromDate: Timestamp.fromDate(new Date(data.fromDate)),
      toDate: Timestamp.fromDate(new Date(data.toDate)),
      paymentDate: Timestamp.now(),
      createdAt: Timestamp.now(),
    });
  };

  return (
    <DataContext.Provider
      value={{
        employees,
        attendance,
        bonuses,
        salaryPayments,
        loading,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        markAttendance,
        addBonus,
        markSalaryPaid,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
