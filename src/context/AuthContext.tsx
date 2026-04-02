import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fetchUserProfile = async (user: User) => {
  // Owner/Admin profiles are stored in users/{uid}
  const ownerDoc = await getDoc(doc(db, "users", user.uid));
  if (ownerDoc.exists()) {
    return ownerDoc.data();
  }

  // Some existing setups may store owner docs with auto ids, so fallback by email.
  if (user.email) {
    const ownerByEmail = await getDocs(
      query(
        collection(db, "users"),
        where("email", "==", user.email),
        limit(1),
      ),
    );
    if (!ownerByEmail.empty) {
      return ownerByEmail.docs[0].data();
    }
  }

  // Employees may be stored with auto doc id, so query by uid/email.
  const byUid = await getDocs(
    query(collection(db, "employees"), where("uid", "==", user.uid), limit(1)),
  );

  if (!byUid.empty) {
    return byUid.docs[0].data();
  }

  if (user.email) {
    const byEmail = await getDocs(
      query(
        collection(db, "employees"),
        where("email", "==", user.email),
        limit(1),
      ),
    );
    if (!byEmail.empty) {
      return byEmail.docs[0].data();
    }
  }

  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Keep guards in a loading state while auth/profile is being resolved.
      setLoading(true);
      setUser(user);
      if (!user) {
        setUserData(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await fetchUserProfile(user);
        setUserData(profile);
      } catch {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = () => signOut(auth);

  const isAdmin = userData?.role === "owner" || userData?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
