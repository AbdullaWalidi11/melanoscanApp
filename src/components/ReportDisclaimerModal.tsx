import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ReportDisclaimerModal({
  visible,
  onClose,
  onConfirm,
}: Props) {
  const [checked, setChecked] = React.useState(false);
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{t("report_selection.modal.title")}</Text>

          <Text style={styles.body}>
            {t("report_selection.modal.body_intro")}
            {"\n\n"}
            <Text style={{ fontWeight: "bold", color: "#d32f2f" }}>
              {t("report_selection.modal.important")}
            </Text>
            {"\n"}
            {t("report_selection.modal.point_1", {
              defaultValue:
                "• This document is <bold>NOT</bold> a medical diagnosis.",
            })
              .replace("<bold>", "")
              .replace("</bold>", "")}
            {"\n"}
            {t("report_selection.modal.point_2")}
            {"\n"}
            {t("report_selection.modal.point_3")}
          </Text>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setChecked(!checked)}
          >
            <Ionicons
              name={checked ? "checkbox" : "square-outline"}
              size={24}
              color="#fe948d"
            />
            <Text style={styles.checkboxText}>
              {t("report_selection.modal.checkbox")}
            </Text>
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>
                {t("report_selection.modal.cancel")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={!checked}
              style={[styles.confirmBtn, { opacity: checked ? 1 : 0.5 }]}
            >
              <Text style={styles.confirmText}>
                {t("report_selection.modal.generate")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#5a3e3e",
    marginBottom: 16,
    textAlign: "center",
  },
  body: { fontSize: 14, color: "#555", lineHeight: 20, marginBottom: 20 },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  checkboxText: { flex: 1, marginLeft: 10, fontSize: 13, color: "#333" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 16 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelText: { color: "#999", fontWeight: "bold" },
  confirmBtn: {
    backgroundColor: "#fe948d",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  confirmText: { color: "white", fontWeight: "bold" },
});
