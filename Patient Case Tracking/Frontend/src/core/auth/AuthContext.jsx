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
      } else {
        // Default to Demo Doctor for seamless hackathon walkthrough experience
        const defaultDoctor = DEMO_USERS[0];
        const initialUser = {
          id: 'usr_doc_default_01',
          name: defaultDoctor.name,
          email: defaultDoctor.email,
          role: defaultDoctor.role,
          department: defaultDoctor.department,
          license: defaultDoctor.license,
        };
        const initialToken = 'jwt_demo_token_doctor_session';
        localStorage.setItem(STORAGE_TOKEN_KEY, initialToken);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(initialUser));
        setToken(initialToken);
        setUser(initialUser);
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
      // 2. Demo User Fallback check if backend is offline
      const matchedDemo = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (matchedDemo) {
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

      // Generic Demo User Login (if any credentials entered)
      if (email && password) {
        const genericUser = {
          id: `usr_staff_${Date.now()}`,
          name: email.split('@')[0].replace('.', ' ').toUpperCase(),
          email: email,
          role: ROLES.DOCTOR,
          department: 'General OPD',
          license: 'AIIA-GEN-99',
        };
        const genericToken = `jwt_simulated_${Date.now()}`;
        saveSession(genericToken, genericUser);
        return { success: true, user: genericUser, isDemoFallback: true };
      }

      const errorMessage = apiErr?.message || 'Invalid credentials. Please try again.';
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
      id: `usr_demo_${demo.role.toLowerCase()}`,
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
    register,
    logout,
    switchDemoRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
