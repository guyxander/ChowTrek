import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { getCurrentSessionIdentity } from "../repositories/authRepository";
import {
  loadProfileCompletion,
  saveProfilePhone
} from "../repositories/profileCompletionRepository";
import { colors } from "../theme/colors";

type Props = {
  onBack: () => void;
};

export function ProfileEditScreen({ onBack }: Props) {
  const [identity, setIdentity] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("Save your phone before checkout.");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getCurrentSessionIdentity().then(setIdentity);
    loadProfileCompletion().then((result) => {
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setPhoneNumber(result.data.phone);
    });
  }, []);

  async function handleSavePhone() {
    setIsSaving(true);
    const result = await saveProfilePhone(phoneNumber);
    setMessage(result.message);
    if (result.ok) {
      const latest = await loadProfileCompletion();
      if (latest.ok) {
        setPhoneNumber(latest.data.phone);
      }
    }
    setIsSaving(false);
  }

  return (
    <View>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.iconButton}>
          <Ionicons color={colors.deepGreen} name="arrow-back" size={22} />
        </TouchableOpacity>
        <View>
          <Text style={styles.eyebrow}>Buyer profile</Text>
          <Text style={styles.title}>Edit profile</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Ionicons color="#ffffff" name="person" size={24} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name}>{identity ?? "ChowTrek Guest"}</Text>
            <Text style={styles.copy}>Your saved phone is required before buyer checkout.</Text>
          </View>
        </View>

        <View style={styles.inputBlock}>
          <View style={styles.inputLabelRow}>
            <Ionicons color={colors.muted} name="call-outline" size={18} />
            <Text style={styles.inputLabel}>Phone number</Text>
          </View>
          <TextInput
            keyboardType="phone-pad"
            onChangeText={setPhoneNumber}
            placeholder="+234..."
            placeholderTextColor={colors.muted}
            style={styles.textInput}
            value={phoneNumber}
          />
        </View>

        <TouchableOpacity
          disabled={isSaving}
          onPress={handleSavePhone}
          style={[styles.saveButton, isSaving ? styles.disabledButton : null]}
        >
          <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : "Save phone"}</Text>
        </TouchableOpacity>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: colors.deepGreen,
    borderRadius: 16,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  card: {
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.28)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    marginTop: 18,
    padding: 16
  },
  copy: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 3
  },
  disabledButton: {
    opacity: 0.62
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  headerText: {
    flex: 1
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 10,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  inputBlock: {
    gap: 8
  },
  inputLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800"
  },
  inputLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  message: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center"
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.deepGreen,
    borderRadius: 8,
    justifyContent: "center",
    paddingVertical: 12
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900"
  },
  textInput: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: "rgba(191, 201, 195, 0.52)",
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 11
  },
  title: {
    color: colors.deepGreen,
    fontSize: 22,
    fontWeight: "900"
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  }
});
