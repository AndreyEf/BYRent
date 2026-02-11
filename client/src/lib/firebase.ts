import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  Auth
} from "firebase/auth";

// Validate Firebase environment variables
const requiredEnvVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if all required variables are present
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => `VITE_FIREBASE_${key.toUpperCase().replace(/([A-Z])/g, '_$1')}`);

if (missingVars.length > 0) {
  console.error(
    `Firebase configuration error: Missing environment variables: ${missingVars.join(', ')}\n` +
    `Please create a .env file in the project root with these variables.`
  );
}

const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey || '',
  authDomain: requiredEnvVars.authDomain || '',
  projectId: requiredEnvVars.projectId || '',
  appId: requiredEnvVars.appId || '',
};

// Only initialize Firebase if we have valid configuration
let app;
let auth: Auth;

try {
  if (missingVars.length === 0) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
  } else {
    // Create a dummy auth object to prevent runtime errors
    // The actual Firebase calls will fail with a more descriptive error
    console.warn('Firebase not initialized due to missing configuration');
    auth = {} as Auth;
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  auth = {} as Auth;
}

export { auth };

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
