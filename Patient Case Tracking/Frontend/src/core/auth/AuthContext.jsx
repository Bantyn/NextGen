import React, { createContext, useState, useEffect, useCallback } from 'react';
import { ROLES, DEMO_USERS } from '../config/roles';
import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../api/apiEndpoints';

export const AuthContext = createContext(null);

const STORAGE_TOKEN_KEY = 'sehat_token';
const STORAGE_USER_KEY = 'sehat_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize Auth State from LocalStorage
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(STORAGE_TOKEN_KEY) || localStorage.getItem('medikiosk_token');
      const savedUserStr = localStorage.getItem(STORAGE_USER_KEY) || localStorage.getItem('medikiosk_user');

      if (savedToken && savedUserStr) {
        const parsedUser = JSON.parse(savedUserStr);
        setToken(savedToken);
        setUser(parsedUser);
      }
    } catch (err) {
      console.error('Failed to parse cached auth state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save auth session to state & localStorage
   */
  const saveSession = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setError(null);
    try {
      localStorage.setItem(STORAGE_TOKEN_KEY, newToken);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newUser));
    } catch (err) {
      console.error('Failed to store auth state in localStorage:', err);
    }
  }, []);

  /**
   * Login method: Attempts real backend call first, falls back to demo account
   */
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Attempt Real Backend API
      const res = await apiClient.post(API_ENDPOINTS.AUTH_LOGIN, { email, password });
      if (res?.data?.token && res?.data?.user) {
        saveSession(res.data.token, res.data.user);
        return { success: true, user: res.data.user };
      }
      throw new Error(res?.message || 'Login failed');
    } catch (apiErr) {
      // Demo User Fallback — only for explicitly pre-configured demo accounts (offline dev mode)
      const matchedDemo = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (matchedDemo) {
        // Verify password matches demo account password
        if (matchedDemo.password && matchedDemo.password !== password) {
          const err = new Error('Invalid email address or password.');
          err.code = 'INVALID_CREDENTIALS';
          setError(err.message);
          setIsLoading(false);
          throw err;
        }
        const fallbackUser = {
          id: `usr_demo_${matchedDemo.role.toLowerCase()}`,
          name: matchedDemo.name,
          email: matchedDemo.email,
          role: matchedDemo.role,
          department: matchedDemo.department,
          license: matchedDemo.license,
        };
        const fallbackToken = `jwt_demo_token_${matchedDemo.role.toLowerCase()}_${Date.now()}`;
        saveSession(fallbackToken, fallbackUser);
        return { success: true, user: fallbackUser, isDemoFallback: true };
      }

      // No backend, no demo match → surface the real error
      const errorMessage = apiErr?.response?.data?.message || apiErr?.message || 'Invalid email address or password.';

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [saveSession]);

  /**
   * Register new healthcare staff
   */
  const register = useCallback(async (formData) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Attempt real API
      const res = await apiClient.post(API_ENDPOINTS.AUTH_REGISTER, formData);
      if (res?.data?.token && res?.data?.user) {
        saveSession(res.data.token, res.data.user);
        return { success: true, user: res.data.user };
      }
      throw new Error(res?.message || 'Registration failed');
    } catch (apiErr) {
      // 2. Offline Demo Registration fallback
      const newUser = {
        id: `usr_${Date.now()}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role || ROLES.DOCTOR,
        age: formData.age ? Number(formData.age) : null,
        gender: formData.gender ? String(formData.gender).toUpperCase() : 'OTHER',
        department: formData.department || 'Ayush & Clinical Intake',
        license: formData.license || `AIIA-REG-${Math.floor(1000 + Math.random() * 9000)}`,
      };
      const newToken = `jwt_registered_${Date.now()}`;
      saveSession(newToken, newUser);
      return { success: true, user: newUser, isDemoFallback: true };
    } finally {
      setIsLoading(false);
    }
  }, [saveSession]);

  /**
   * Quick Switch Demo Role (for testing all persona views instantly)
   */
  const switchDemoRole = useCallback((role) => {
    const demo = DEMO_USERS.find((u) => u.role === role) || DEMO_USERS[0];
    const newUser = {
      id: demo.patient_id || demo.id || `usr_demo_${demo.role.toLowerCase()}`,
      patient_id: demo.patient_id || demo.id,
      name: demo.name,
      email: demo.email,
      role: demo.role,
      department: demo.department,
      license: demo.license,
    };
    const newToken = `jwt_demo_${demo.role.toLowerCase()}_${Date.now()}`;
    saveSession(newToken, newUser);
    return newUser;
  }, [saveSession]);

  /**
   * Dedicated Patient Login (ABHA / Phone / Registered Profile)
   */
  const loginAsPatient = useCallback((patientData, customToken = null) => {
    if (!patientData) return { success: false, error: 'Patient data required' };
    const pId = patientData.patient_id || patientData.id;
    if (!pId) return { success: false, error: 'Patient ID missing' };

    const patientUser = {
      id: pId,
      patient_id: pId,
      name: patientData.name || `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim() || 'Patient',
      email: patientData.email || `${pId.toLowerCase()}@sehat.org`,
      phone: patientData.phone || '',
      abhaId: patientData.abhaId || patientData.abha_id || null,
      role: ROLES.PATIENT,
      department: 'Patient Portal',
      license: patientData.abhaId || patientData.abha_id || null,
    };
    const token = customToken || `jwt_patient_${patientUser.id}_${Date.now()}`;
    saveSession(token, patientUser);
    try {
      sessionStorage.setItem('selected_patient_id', pId);
    } catch {}
    return { success: true, user: patientUser };
  }, [saveSession]);

  /**
   * Dedicated Backend Patient Login (via ABHA / Phone / ID)
   */
  const loginPatientWithBackend = useCallback(async (identifier, dateOfBirth = null) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/auth/patient-login', { identifier, date_of_birth: dateOfBirth });
      const token = res?.data?.token || res?.token;
      const patient = res?.data?.patient || res?.patient;
      if (token && patient) {
        const patientUser = {
          id: patient.patient_id,
          patient_id: patient.patient_id,
          name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
          email: `${patient.patient_id.toLowerCase()}@sehat.org`,
          phone: patient.phone,
          abhaId: patient.abha_id,
          role: ROLES.PATIENT,
          department: 'Patient Portal',
        };
        saveSession(token, patientUser);
        try {
          sessionStorage.setItem('selected_patient_id', patient.patient_id);
        } catch {}
        return { success: true, user: patientUser, token };
      }
      throw new Error(res?.message || 'Patient login failed');
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [saveSession]);

  /**
   * Logout user and clear tokens
   */
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
    try {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem('medikiosk_token');
      localStorage.removeItem('medikiosk_user');
      sessionStorage.removeItem('selected_patient_id');
      sessionStorage.removeItem('patient_session');
    } catch (err) {
      console.error('Failed to clear storage:', err);
    }
  }, []);

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: Boolean(token && user),
    isLoading,
    error,
    login,
    loginAsPatient,
    loginPatientWithBackend,
    register,
    logout,
    switchDemoRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
