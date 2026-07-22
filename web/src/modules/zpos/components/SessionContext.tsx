'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SessionContextType {
  session: any | null;
  isSessionLoading: boolean;
  showOpenSession: boolean;
  setShowOpenSession: (show: boolean) => void;
  fetchSession: (token: string) => Promise<void>;
}

export const SessionContext = createContext<SessionContextType>({
  session: null,
  isSessionLoading: true,
  showOpenSession: false,
  setShowOpenSession: () => {},
  fetchSession: async () => {},
});

export const useSession = () => useContext(SessionContext);
