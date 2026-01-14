import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  Auth
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth: Auth = getAuth(app);

let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;

export function initRecaptcha(containerId: string): RecaptchaVerifier | null {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`reCAPTCHA container '${containerId}' not found`);
    return null;
  }
  
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (e) {
      console.warn("Error clearing recaptcha:", e);
    }
  }
  
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {},
  });
  
  return recaptchaVerifier;
}

export async function sendVerificationCode(phoneNumber: string): Promise<boolean> {
  try {
    if (!recaptchaVerifier) {
      throw new Error("reCAPTCHA not initialized");
    }
    
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return true;
  } catch (error) {
    console.error("Error sending verification code:", error);
    throw error;
  }
}

export async function verifyCode(code: string): Promise<boolean> {
  try {
    if (!confirmationResult) {
      throw new Error("No verification in progress");
    }
    
    await confirmationResult.confirm(code);
    return true;
  } catch (error) {
    console.error("Error verifying code:", error);
    throw error;
  }
}

export function clearRecaptcha() {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  confirmationResult = null;
}
