import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { USERNAME_REGEX } from "../services/auth";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { typography } from "../styles/typography";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

type TabParamList = {
  Home: undefined;
  Progress: undefined;
  Profile: undefined;
};

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const {
    authProfile,
    signUp,
    login,
    logout,
    updateUserUsername,
    updateUserEmail,
  } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Inline validation errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [identifierError, setIdentifierError] = useState<string | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editingEmail, setEditingEmail] = useState("");
  const [editingUsername, setEditingUsername] = useState("");

  const validateEmail = (emailValue: string): string | null => {
    if (!emailValue.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue.trim())) {
      return "Please enter a valid email address";
    }
    return null;
  };

  const validateUsername = (usernameValue: string): string | null => {
    if (!usernameValue.trim()) {
      return "Username is required";
    }
    if (usernameValue.trim().length < 4) {
      return "Username must be at least 4 characters";
    }
    if (usernameValue.trim().length > 20) {
      return "Username must be no more than 20 characters";
    }
    if (!USERNAME_REGEX.test(usernameValue.trim())) {
      return "Username can only contain letters and numbers (no spaces or special characters)";
    }
    return null;
  };

  const validatePassword = (passwordValue: string): string | null => {
    if (!passwordValue) {
      return "Password is required";
    }
    if (passwordValue.length < 8) {
      return "Password must be at least 8 characters";
    }
    return null;
  };

  const parseServerError = (
    error: string | null
  ): {
    emailError?: string;
    usernameError?: string;
    passwordError?: string;
    generalError?: string;
  } => {
    if (!error) return {};

    const errorLower = error.toLowerCase();

    // Email already exists - check multiple patterns
    if (
      errorLower.includes("email") &&
      (errorLower.includes("already") ||
        errorLower.includes("exists") ||
        errorLower.includes("registered") ||
        errorLower.includes("taken"))
    ) {
      return { emailError: "This email is already registered" };
    }

    // Check for "user already registered" without email keyword
    if (
      errorLower.includes("already registered") ||
      errorLower.includes("user already")
    ) {
      return { emailError: "This email is already registered" };
    }

    // Username already taken
    if (
      errorLower.includes("username") &&
      (errorLower.includes("already") ||
        errorLower.includes("taken") ||
        errorLower.includes("unique"))
    ) {
      return { usernameError: "This username is already taken" };
    }

    // Password too short or invalid
    if (errorLower.includes("password")) {
      if (
        errorLower.includes("8") ||
        errorLower.includes("length") ||
        errorLower.includes("short")
      ) {
        return { passwordError: "Password must be at least 8 characters" };
      }
      return { passwordError: "Invalid password" };
    }

    // General error - return as-is
    return { generalError: error };
  };

  const handleSignup = async () => {
    setEmailError(null);
    setUsernameError(null);
    setPasswordError(null);

    // Validate inputs
    const emailErr = validateEmail(email);
    const usernameErr = validateUsername(username);
    const passwordErr = validatePassword(password);

    if (emailErr) {
      setEmailError(emailErr);
    }
    if (usernameErr) {
      setUsernameError(usernameErr);
    }
    if (passwordErr) {
      setPasswordError(passwordErr);
    }

    if (emailErr || usernameErr || passwordErr) {
      return;
    }

    setLoading(true);
    const { error } = await signUp(email.trim(), username.trim(), password);
    setLoading(false);

    if (error) {
      const parsedErrors = parseServerError(error);

      if (parsedErrors.emailError) {
        setEmailError(parsedErrors.emailError);
      }
      if (parsedErrors.usernameError) {
        setUsernameError(parsedErrors.usernameError);
      }
      if (parsedErrors.passwordError) {
        setPasswordError(parsedErrors.passwordError);
      }
      // Show general error on email field if no specific field error
      if (
        parsedErrors.generalError &&
        !parsedErrors.emailError &&
        !parsedErrors.usernameError &&
        !parsedErrors.passwordError
      ) {
        setEmailError(parsedErrors.generalError);
      }
      return;
    }

    setEmail("");
    setUsername("");
    setPassword("");
    setEmailError(null);
    setUsernameError(null);
    setPasswordError(null);

    Alert.alert(
      "Account created",
      "Your progress is now linked to this account."
    );
  };

  const handleLogin = async () => {
    setIdentifierError(null);
    setPasswordError(null);

    if (!identifier.trim()) {
      setIdentifierError("Email or username is required");
      return;
    }
    if (!password) {
      setPasswordError("Password is required");
      return;
    }

    setLoading(true);
    const { error } = await login(identifier.trim(), password);
    setLoading(false);

    if (error) {
      const parsedErrors = parseServerError(error);

      if (parsedErrors.generalError) {
        if (
          error?.toLowerCase().includes("username") ||
          error?.toLowerCase().includes("not found")
        ) {
          setIdentifierError(error);
        } else if (
          error?.toLowerCase().includes("password") ||
          error?.toLowerCase().includes("invalid")
        ) {
          setPasswordError("Invalid password");
        } else {
          setIdentifierError(error ?? "Login failed");
        }
      }
      return;
    }

    setIdentifier("");
    setPassword("");
    setIdentifierError(null);
    setPasswordError(null);

    navigation.navigate("Home");

    Alert.alert(
      "Logged in",
      "Your account progress has been loaded on this device."
    );
  };

  const handleLogout = async () => {
    setIsEditing(false);
    await logout();
    setMode("login");
    Alert.alert("Logged out", "You are now playing as a guest on this device.");
  };

  const handleStartEdit = () => {
    // Prefer pending email over confirmed email for editing
    const emailToEdit = authProfile?.profileEmail ?? authProfile?.email ?? "";
    setEditingEmail(emailToEdit);
    setEditingUsername(authProfile?.username ?? "");
    setEmailError(null);
    setUsernameError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingEmail("");
    setEditingUsername("");
    setEmailError(null);
    setUsernameError(null);
  };

  const handleSaveChanges = async () => {
    if (!authProfile) return;

    setEmailError(null);
    setUsernameError(null);

    const currentEmail = authProfile.profileEmail ?? authProfile.email ?? "";
    let hasErrors = false;

    if (editingEmail.trim() !== currentEmail) {
      const emailErr = validateEmail(editingEmail);
      if (emailErr) {
        setEmailError(emailErr);
        hasErrors = true;
      }
    }

    if (editingUsername.trim() !== (authProfile.username ?? "")) {
      const usernameErr = validateUsername(editingUsername);
      if (usernameErr) {
        setUsernameError(usernameErr);
        hasErrors = true;
      }
    }

    if (hasErrors) {
      return;
    }

    setLoading(true);
    let updateError: string | null = null;

    if (editingEmail.trim() !== currentEmail) {
      const { success, error } = await updateUserEmail(editingEmail.trim());
      if (!success) {
        updateError = error ?? "Failed to update email";
        setEmailError(updateError);
        setLoading(false);
        return;
      }
    }

    if (editingUsername.trim() !== (authProfile.username ?? "")) {
      const { success, error } = await updateUserUsername(
        editingUsername.trim()
      );
      if (!success) {
        updateError = error ?? "Failed to update username";
        setUsernameError(updateError);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    setIsEditing(false);
    Alert.alert("Success", "Your profile has been updated.");
  };

  const renderLoggedIn = () => {
    const hasPendingEmail =
      authProfile?.profileEmail &&
      authProfile?.email &&
      authProfile.profileEmail !== authProfile.email;

    return (
      <View style={styles.card}>
        {!isEditing ? (
          <>
            {hasPendingEmail ? (
              <>
                <Text style={styles.label}>Current Email (Active)</Text>
                <Text style={styles.value}>{authProfile?.email ?? "—"}</Text>
                <Text style={styles.label}>
                  New Email (Pending Confirmation)
                </Text>
                <View style={styles.pendingEmailContainer}>
                  <Text style={styles.pendingEmailValue}>
                    {authProfile?.profileEmail ?? "—"}
                  </Text>
                  <Text style={styles.pendingEmailNote}>
                    Please check your email to confirm this address
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>
                  {authProfile?.email ?? authProfile?.profileEmail ?? "—"}
                </Text>
              </>
            )}
            <Text style={styles.label}>Username</Text>
            <Text style={styles.value}>{authProfile?.username ?? "—"}</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={handleStartEdit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.logoutButton]}
              onPress={handleLogout}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Log out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, emailError && styles.inputError]}
              value={editingEmail}
              onChangeText={(text) => {
                setEditingEmail(text);
                if (emailError) setEmailError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Enter email"
              placeholderTextColor="#95A5A6"
            />
            {emailError && <Text style={styles.errorText}>{emailError}</Text>}

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[styles.input, usernameError && styles.inputError]}
              value={editingUsername}
              onChangeText={(text) => {
                setEditingUsername(text);
                if (usernameError) setUsernameError(null);
              }}
              autoCapitalize="none"
              placeholder="Enter username"
              placeholderTextColor="#95A5A6"
            />
            {usernameError && (
              <Text style={styles.errorText}>{usernameError}</Text>
            )}

            <View style={styles.editButtonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancelEdit}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleSaveChanges}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Saving..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderAuthForms = () => (
    <View style={styles.card}>
      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === "signup" && styles.activeTab]}
            onPress={() => setMode("signup")}
          >
            <Text
              style={[
                styles.tabText,
                mode === "signup" && styles.activeTabText,
              ]}
            >
              Create account
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === "login" && styles.activeTab]}
            onPress={() => setMode("login")}
          >
            <Text
              style={[styles.tabText, mode === "login" && styles.activeTabText]}
            >
              Log in
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {mode === "signup" ? (
        <>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, emailError && styles.inputError]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError(null);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="#95A5A6"
          />
          {emailError && <Text style={styles.errorText}>{emailError}</Text>}

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={[styles.input, usernameError && styles.inputError]}
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (usernameError) setUsernameError(null);
            }}
            autoCapitalize="none"
            placeholder="cool_username"
            placeholderTextColor="#95A5A6"
          />
          {usernameError && (
            <Text style={styles.errorText}>{usernameError}</Text>
          )}

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, passwordError && styles.inputError]}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError(null);
            }}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#95A5A6"
          />
          {passwordError && (
            <Text style={styles.errorText}>{passwordError}</Text>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Creating..." : "Create account"}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>Email or username</Text>
          <TextInput
            style={[styles.input, identifierError && styles.inputError]}
            value={identifier}
            onChangeText={(text) => {
              setIdentifier(text);
              if (identifierError) setIdentifierError(null);
            }}
            autoCapitalize="none"
            placeholder="you@example.com or cool_username"
            placeholderTextColor="#95A5A6"
          />
          {identifierError && (
            <Text style={styles.errorText}>{identifierError}</Text>
          )}

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, passwordError && styles.inputError]}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError(null);
            }}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#95A5A6"
          />
          {passwordError && (
            <Text style={styles.errorText}>{passwordError}</Text>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Logging in..." : "Log in"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.helperText}>
        You can always keep playing as a guest. Creating an account lets you
        sync progress across devices.
      </Text>
    </View>
  );

  const isAuthenticated =
    authProfile && (authProfile.email || authProfile.username);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>
        {isAuthenticated
          ? "Manage your account and sync progress across devices."
          : "Upgrade your guest profile to save progress across devices."}
      </Text>

      {isAuthenticated ? renderLoggedIn() : renderAuthForms()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: typography.fontFamily.bold,
    color: "#2C3E50",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: "#7F8C8D",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: "#34495E",
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: "#2C3E50",
    marginTop: 2,
    marginBottom: 12,
  },
  input: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#D0D7DE",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    backgroundColor: "#FDFDFD",
  },
  button: {
    marginTop: 16,
    backgroundColor: "#4ECDC4",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutButton: {
    backgroundColor: "#E74C3C",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
  },
  helperText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: "#95A5A6",
    marginTop: 12,
  },
  tabsContainer: {
    marginBottom: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 4,
  },
  tabs: {
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7F8C8D",
  },
  activeTabText: {
    color: "#4ECDC4",
  },
  inputError: {
    borderColor: "#E74C3C",
  },
  errorText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: "#E74C3C",
    marginTop: 4,
    marginBottom: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  editButtonRow: {
    flexDirection: "row",
    marginTop: 16,
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#95A5A6",
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
  pendingEmailContainer: {
    marginTop: 4,
  },
  pendingEmailValue: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: "#E67E22",
    marginBottom: 4,
  },
  pendingEmailNote: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: "#E67E22",
    fontStyle: "italic",
  },
});
