import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { Colors } from "../../src/constants/Colors";
import { Mail, Lock, Eye, EyeOff, Plane } from "lucide-react-native";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                Alert.alert(
                    "Success",
                    "Check your email for the confirmation link!"
                );
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.replace("/client");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Plane size={32} color={Colors.white} />
                </View>
                <Text style={styles.logoText}>GoBuddy</Text>
                <Text style={styles.subtitle}>Adventures</Text>
            </View>

            <View style={styles.form}>
                <Text style={styles.title}>
                    {isSignUp ? "Create Account" : "Welcome Back"}
                </Text>
                <Text style={styles.description}>
                    {isSignUp
                        ? "Sign up to view your trips"
                        : "Sign in to continue"}
                </Text>

                <View style={styles.inputContainer}>
                    <Mail size={20} color={Colors.gray} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={Colors.gray}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Lock size={20} color={Colors.gray} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={Colors.gray}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                    >
                        {showPassword ? (
                            <EyeOff size={20} color={Colors.gray} />
                        ) : (
                            <Eye size={20} color={Colors.gray} />
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleAuth}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <Text style={styles.buttonText}>
                            {isSignUp ? "Sign Up" : "Sign In"}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.switchButton}
                    onPress={() => setIsSignUp(!isSignUp)}
                >
                    <Text style={styles.switchText}>
                        {isSignUp
                            ? "Already have an account? Sign In"
                            : "Don't have an account? Sign Up"}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        backgroundColor: Colors.primary,
        paddingTop: 80,
        paddingBottom: 40,
        alignItems: "center",
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    logoContainer: {
        width: 64,
        height: 64,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    logoText: {
        fontSize: 32,
        fontWeight: "bold",
        color: Colors.white,
    },
    subtitle: {
        fontSize: 18,
        color: "rgba(255,255,255,0.8)",
        marginTop: -4,
    },
    form: {
        flex: 1,
        padding: 24,
        paddingTop: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: Colors.secondary,
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: Colors.gray,
        marginBottom: 32,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: "#1f2937",
    },
    eyeIcon: {
        padding: 8,
    },
    button: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: "600",
    },
    switchButton: {
        marginTop: 24,
        alignItems: "center",
    },
    switchText: {
        color: Colors.secondary,
        fontSize: 14,
    },
});
