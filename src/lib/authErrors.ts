import { FirebaseError } from "firebase/app";

export function authErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "An account with that email already exists.";
      case "auth/invalid-email":
        return "That email address looks invalid.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Incorrect email or password.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a moment and try again.";
      case "auth/user-disabled":
        return "This account has been disabled. Contact support if you think this is a mistake.";
      case "auth/expired-action-code":
        return "This link has expired. Request a new one.";
      case "auth/invalid-action-code":
        return "This link is invalid or has already been used.";
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again.";
      default:
        return error.message.replace("Firebase: ", "");
    }
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
