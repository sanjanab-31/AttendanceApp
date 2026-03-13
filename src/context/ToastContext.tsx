import Ionicons from "@expo/vector-icons/Ionicons";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error";

type ToastState = {
  visible: boolean;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "success",
  });

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -10,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast((prev) => ({ ...prev, visible: false, message: "" }));
    });
  }, [opacity, translateY]);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setToast({ visible: true, message, type });
      opacity.setValue(0);
      translateY.setValue(-10);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(() => {
        hideToast();
      }, 3500);
    },
    [hideToast, opacity, translateY],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const value = useMemo(
    () => ({
      showToast,
    }),
    [showToast],
  );

  const isSuccess = toast.type === "success";

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast.visible ? (
        <View pointerEvents="box-none" style={styles.portal}>
          <Animated.View
            style={[
              styles.toast,
              {
                top: insets.top + 12,
                backgroundColor: isSuccess ? "#065f46" : "#b91c1c",
                opacity,
                transform: [{ translateY }],
              },
            ]}
          >
            <Ionicons
              name={isSuccess ? "checkmark-circle" : "alert-circle"}
              size={18}
              color="#ffffff"
            />
            <Text style={styles.toastText}>{toast.message}</Text>
            <Pressable onPress={hideToast} hitSlop={8}>
              <Ionicons name="close" size={16} color="#ffffff" />
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}

const styles = StyleSheet.create({
  portal: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    pointerEvents: "box-none",
  },
  toast: {
    position: "absolute",
    right: 12,
    maxWidth: "88%",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  toastText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
    marginRight: 10,
    flexShrink: 1,
  },
});
