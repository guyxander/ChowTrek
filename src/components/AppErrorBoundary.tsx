import { Component, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

type Props = {
  children: ReactNode;
};

type State = {
  errorMessage: string | null;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    errorMessage: null
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      errorMessage: error.message || "ChowTrek hit an unexpected startup error."
    };
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>ChowTrek needs a restart</Text>
          <Text style={styles.body}>{this.state.errorMessage}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
    textAlign: "center"
  },
  container: {
    alignItems: "center",
    backgroundColor: colors.surface,
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  title: {
    color: colors.deepGreen,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center"
  }
});
