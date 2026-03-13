import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  variant?: "delete" | "update";
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText,
  cancelText = "Cancel",
  variant = "update",
  onCancel,
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      backdropOpacity.setValue(0);
      scale.setValue(0.95);
      contentOpacity.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, contentOpacity, scale, visible]);

  const isDelete = variant === "delete";

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={styles.overlayWrap}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
          pointerEvents="none"
        />

        <Pressable style={styles.overlayPressable} onPress={onCancel} />

        <Animated.View
          style={[
            styles.card,
            {
              opacity: contentOpacity,
              transform: [{ scale }],
            },
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              isDelete ? styles.iconWrapDelete : styles.iconWrapUpdate,
            ]}
          >
            <Ionicons
              name={isDelete ? "warning-outline" : "checkmark-circle-outline"}
              size={24}
              color={isDelete ? "#b45309" : "#047857"}
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              disabled={loading}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={loading}
              style={[
                styles.confirmBtn,
                isDelete ? styles.confirmBtnDelete : styles.confirmBtnUpdate,
                loading ? styles.disabled : null,
              ]}
            >
              <Text style={styles.confirmText}>
                {loading ? "Please wait..." : confirmText}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  overlayPressable: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#0f172a",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 14,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconWrapDelete: {
    backgroundColor: "#fef3c7",
  },
  iconWrapUpdate: {
    backgroundColor: "#d1fae5",
  },
  title: {
    fontSize: 19,
    fontWeight: "700",
    color: "#0f172a",
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 18,
  },
  cancelBtn: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
  },
  cancelText: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 13,
  },
  confirmBtn: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  confirmBtnDelete: {
    backgroundColor: "#dc2626",
  },
  confirmBtnUpdate: {
    backgroundColor: "#0f766e",
  },
  confirmText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  disabled: {
    opacity: 0.7,
  },
});
