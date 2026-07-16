import { StyleSheet } from "react-native";

import { colors } from "./colors";

export const sharedStyles = StyleSheet.create({
  bodyCopy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  inlineMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 12
  },
  metaText: {
    color: colors.muted,
    fontSize: 13
  },
  screenTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 8
  },
  subtle: {
    color: colors.muted,
    fontSize: 12
  }
});
