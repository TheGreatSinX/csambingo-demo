import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  MultiFactorResolver,
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  PhoneMultiFactorGenerator,
  PhoneAuthProvider,
  multiFactor
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { AdminRole, AdminUser } from '../game/gameTypes';
import { appendAuditLog } from '../services/adminService';
import { verifyTotpToken } from '../utils/totp';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  adminProfile: AdminUser | null;
  isAdmin: boolean;
  role: AdminRole | null;
  mfaVerified: boolean;
  mfaResolver: MultiFactorResolver | null;
  loginWithEmail: (email: string, pass: string) => Promise<{ requiresMfa: boolean }>;
  verifyMfaChallenge: (code: string) => Promise<boolean>;
  enrollTotpMfa: (secret: string, code: string) => Promise<boolean>;
  resetAdminTotpMfa: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setMfaVerified: (verified: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const BOOTSTRAPPED_ADMIN_EMAIL = 'webdev.cybernetics@gmail.com';
const ADMIN_SESSION_KEY = 'cyber_bingo_admin_session';
const MFA_VERIFIED_KEY = 'cyber_bingo_mfa_verified';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(() => {
    try {
      const saved = sessionStorage.getItem(ADMIN_SESSION_KEY);
      return saved ? (JSON.parse(saved) as AdminUser) : null;
    } catch {
      return null;
    }
  });
  const [mfaVerified, setMfaVerifiedState] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(MFA_VERIFIED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);

  const setMfaVerified = (verified: boolean) => {
    setMfaVerifiedState(verified);
    try {
      if (verified) {
        sessionStorage.setItem(MFA_VERIFIED_KEY, 'true');
      } else {
        sessionStorage.removeItem(MFA_VERIFIED_KEY);
      }
    } catch {}
  };

  // Check admin role and enforce strict administrator-only access
  const checkAdminRole = async (currentUser: User): Promise<boolean> => {
    try {
      const emailLower = (currentUser.email || '').toLowerCase();
      const isBootstrapped = emailLower === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();

      // Check Firestore admins collection by UID or by Email
      const adminDocRef = doc(db, 'admins', currentUser.uid);
      const adminSnap = await getDoc(adminDocRef);

      if (adminSnap.exists()) {
        const data = adminSnap.data() as AdminUser;
        setAdminProfile(data);
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(data));
        return true;
      }

      // Also check email-keyed allowlist doc (e.g., admins/email_...)
      if (emailLower) {
        const emailDocId = `email_${emailLower.replace(/[^a-z0-9]/g, '_')}`;
        const emailSnap = await getDoc(doc(db, 'admins', emailDocId));
        if (emailSnap.exists()) {
          const data = emailSnap.data() as AdminUser;
          const profileWithUid: AdminUser = {
            ...data,
            id: currentUser.uid,
            lastLogin: new Date().toISOString(),
          };
          await setDoc(adminDocRef, profileWithUid).catch(() => {});
          setAdminProfile(profileWithUid);
          sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(profileWithUid));
          return true;
        }
      }

      // Check if user authenticated via Email/Password (created in Firebase Console -> Authentication -> Users)
      const isPasswordProvider = currentUser.providerData.some(
        (p) => p.providerId === 'password'
      );

      if (isBootstrapped || isPasswordProvider) {
        // Auto-provision admin document in Firestore for accounts created in Firebase Console
        const autoProvisionedProfile: AdminUser = {
          id: currentUser.uid,
          email: currentUser.email || BOOTSTRAPPED_ADMIN_EMAIL,
          role: 'SUPER_ADMIN',
          createdAt: new Date().toISOString(),
          mfaEnforced: true,
          lastLogin: new Date().toISOString(),
        };
        await setDoc(adminDocRef, autoProvisionedProfile).catch(() => {});
        setAdminProfile(autoProvisionedProfile);
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(autoProvisionedProfile));
        return true;
      }

      // Unauthorized user: immediately sign out and reject access
      await appendAuditLog({
        actorId: currentUser.uid,
        actorEmail: currentUser.email || 'unknown',
        action: 'UNAUTHORIZED_LOGIN_BLOCKED',
        resource: 'auth/admin_gate',
      });
      await signOut(auth).catch(() => {});
      setUser(null);
      setAdminProfile(null);
      setMfaVerified(false);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return false;
    } catch (error) {
      console.error('Failed to verify admin status:', error);
      if (currentUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
        const fallbackProfile: AdminUser = {
          id: currentUser.uid,
          email: currentUser.email,
          role: 'SUPER_ADMIN',
          createdAt: new Date().toISOString(),
          mfaEnforced: true,
        };
        setAdminProfile(fallbackProfile);
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(fallbackProfile));
        return true;
      }
      await signOut(auth).catch(() => {});
      setUser(null);
      setAdminProfile(null);
      setMfaVerified(false);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await checkAdminRole(currentUser);
      } else {
        setAdminProfile(null);
        setMfaVerified(false);
        try {
          sessionStorage.removeItem(ADMIN_SESSION_KEY);
        } catch {}
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Standard Email/Password login with mandatory MFA intercept
  const loginWithEmail = async (email: string, pass: string): Promise<{ requiresMfa: boolean }> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const authorized = await checkAdminRole(userCredential.user);
      if (!authorized) {
        setLoading(false);
        throw new Error('Access denied: This account is not an authorized Administrator.');
      }
      setUser(userCredential.user);

      // Always require MFA verification after email/password primary factor
      setMfaVerified(false);
      await appendAuditLog({
        actorId: userCredential.user.uid,
        actorEmail: userCredential.user.email || email,
        action: 'ADMIN_PRIMARY_AUTH_VERIFIED_AWAITING_MFA',
        resource: 'auth/mfa_gate',
      });
      setLoading(false);
      return { requiresMfa: true };
    } catch (err: any) {
      setLoading(false);
      // Firebase throws 'auth/multi-factor-auth-required' when native second factor challenge is triggered
      if (err.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, err);
        setMfaResolver(resolver);
        setMfaVerified(false);
        return { requiresMfa: true };
      }
      throw err;
    }
  };

  // Enroll a new TOTP secret for the currently signed-in administrator
  const enrollTotpMfa = async (secret: string, code: string): Promise<boolean> => {
    const isValid = await verifyTotpToken(secret, code);
    if (!isValid) {
      return false;
    }

    const currentUid = user?.uid || adminProfile?.id;
    if (currentUid && adminProfile) {
      const updatedProfile: AdminUser = {
        ...adminProfile,
        mfaEnforced: true,
        totpEnrolled: true,
        totpSecret: secret,
        lastLogin: new Date().toISOString(),
      };
      await setDoc(doc(db, 'admins', currentUid), updatedProfile, { merge: true }).catch(() => {});
      setAdminProfile(updatedProfile);
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(updatedProfile));
      } catch {}
    }

    setMfaVerified(true);
    await appendAuditLog({
      actorId: currentUid || 'admin',
      actorEmail: user?.email || adminProfile?.email || 'admin',
      action: 'ADMIN_MFA_TOTP_ENROLLED_AND_VERIFIED',
      resource: 'auth/mfa',
    });
    return true;
  };

  // Reset TOTP enrollment so the administrator can scan a new QR code
  const resetAdminTotpMfa = async (): Promise<void> => {
    const currentUid = user?.uid || adminProfile?.id;
    if (currentUid && adminProfile) {
      const updatedProfile: AdminUser = {
        ...adminProfile,
        totpEnrolled: false,
        totpSecret: '',
      };
      await setDoc(doc(db, 'admins', currentUid), updatedProfile, { merge: true }).catch(() => {});
      setAdminProfile(updatedProfile);
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(updatedProfile));
      } catch {}
    }
  };

  // Verify MFA Challenge via Firebase Resolver or Enrolled TOTP Secret
  const verifyMfaChallenge = async (code: string): Promise<boolean> => {
    if (!mfaResolver) {
      // Verify against enrolled RFC 6238 TOTP secret stored in adminProfile
      if (adminProfile?.totpSecret) {
        const validTotp = await verifyTotpToken(adminProfile.totpSecret, code);
        if (!validTotp) {
          await appendAuditLog({
            actorId: user?.uid || adminProfile.id,
            actorEmail: user?.email || adminProfile.email,
            action: 'ADMIN_MFA_CHALLENGE_FAILED',
            resource: 'auth/mfa',
          });
          return false;
        }
        setMfaVerified(true);
        await appendAuditLog({
          actorId: user?.uid || adminProfile.id,
          actorEmail: user?.email || adminProfile.email,
          action: 'ADMIN_MFA_CHALLENGE_VERIFIED',
          resource: 'auth/mfa',
        });
        return true;
      }
      return false;
    }

    try {
      // Check first hint type from Firebase native MultiFactorResolver
      const hint = mfaResolver.hints[0];
      if (hint.factorId === TotpMultiFactorGenerator.FACTOR_ID) {
        const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code.trim());
        const userCred = await mfaResolver.resolveSignIn(assertion);
        setUser(userCred.user);
        await checkAdminRole(userCred.user);
        setMfaVerified(true);
        setMfaResolver(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('MFA resolution failed:', err);
      return false;
    }
  };

  // Google Login Popup
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const authorized = await checkAdminRole(res.user);
      if (!authorized) {
        throw new Error('Access denied: Your Google account is not on the Administrator allowlist. Public account creation is disabled.');
      }
      setUser(res.user);
      setMfaVerified(true);
      await appendAuditLog({
        actorId: res.user.uid,
        actorEmail: res.user.email || 'google_user',
        action: 'ADMIN_GOOGLE_LOGIN',
        resource: 'auth/session',
      });
    } catch (err: any) {
      if (err.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, err);
        setMfaResolver(resolver);
      } else {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(MFA_VERIFIED_KEY);
    } catch {}
    if (user) {
      await appendAuditLog({
        actorId: user.uid,
        actorEmail: user.email || 'admin',
        action: 'ADMIN_LOGOUT',
        resource: 'auth/session',
      });
    }
    await signOut(auth).catch(() => {});
    setUser(null);
    setAdminProfile(null);
    setMfaVerified(false);
    setMfaResolver(null);
  };

  const isAdmin = !!adminProfile && (
    adminProfile.role === 'SUPER_ADMIN' ||
    adminProfile.role === 'GAME_ADMIN' ||
    adminProfile.role === 'CONTENT_ADMIN' ||
    adminProfile.role === 'ANALYTICS_ADMIN'
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        adminProfile,
        isAdmin,
        role: adminProfile?.role || null,
        mfaVerified,
        mfaResolver,
        loginWithEmail,
        verifyMfaChallenge,
        enrollTotpMfa,
        resetAdminTotpMfa,
        loginWithGoogle,
        logout,
        setMfaVerified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
