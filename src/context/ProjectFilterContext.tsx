import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Project, UserRole } from '@/types/database';
import { subscribeProjects, seedDefaultProjects } from '@/lib/projectService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ProjectFilterContextValue {
  projects: Project[];
  selectedProjectId: string; // 'ALL' atau projectId
  selectedProject: Project | null;
  setSelectedProjectId: (id: string) => void;
  isLoadingProjects: boolean;
  userRole: UserRole | 'guest';
  isInvestorUser: boolean;
  isDispatcherUser: boolean;
  isManagementUser: boolean;
}

const ProjectFilterContext = createContext<ProjectFilterContextValue | null>(null);

export function ProjectFilterProvider({
  children,
  currentUserEmail
}: {
  children: React.ReactNode;
  currentUserEmail?: string | null;
}): React.JSX.Element {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<UserRole | 'guest'>('guest');
  const [lockedInvestorId, setLockedInvestorId] = useState<string | null>(null);

  // 1. Inisialisasi Seeding dan Subscribe Projects
  useEffect(() => {
    seedDefaultProjects().catch(console.error);

    const unsub = subscribeProjects(list => {
      setProjects(list);
      setIsLoadingProjects(false);
    });

    return () => unsub();
  }, []);

  // 2. Cek Role Pengguna dari system_users berdasarkan email
  useEffect(() => {
    if (!currentUserEmail) {
      setUserRole('guest');
      setLockedInvestorId(null);
      return;
    }

    const clean = currentUserEmail.toLowerCase().trim();
    if (clean === 'fatih@patak.dev') {
      setUserRole('developer');
      return;
    }
    if (clean === 'founder@patak.id') {
      setUserRole('founder');
      return;
    }

    const fetchRole = async () => {
      try {
        const usersCol = collection(db, 'system_users');
        const q = query(usersCol, where('email', '==', clean));
        const snap = await getDocs(q);
        if (!snap.empty && snap.docs[0]) {
          const userData = snap.docs[0].data();
          const role = (userData.role || 'viewer') as UserRole;
          setUserRole(role);
          if (role === 'investor' && userData.investorId) {
            setLockedInvestorId(userData.investorId);
          }
        } else {
          setUserRole('viewer');
        }
      } catch (err) {
        console.warn('Gagal membaca role pengguna:', err);
        setUserRole('viewer');
      }
    };

    fetchRole();
  }, [currentUserEmail]);

  // 3. Jika pengguna adalah role 'investor', kunci selectedProjectId ke proyek miliknya
  useEffect(() => {
    if (userRole === 'investor' && lockedInvestorId && projects.length > 0) {
      const myProject = projects.find(p => p.investorId === lockedInvestorId);
      if (myProject) {
        setSelectedProjectId(myProject.id);
      }
    }
  }, [userRole, lockedInvestorId, projects]);

  const selectedProject = useMemo(() => {
    if (selectedProjectId === 'ALL') return null;
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [selectedProjectId, projects]);

  const isInvestorUser = userRole === 'investor';
  const isDispatcherUser = userRole === 'dispatcher';
  const isManagementUser = userRole === 'developer' || userRole === 'founder' || userRole === 'admin';

  return (
    <ProjectFilterContext.Provider
      value={{
        projects,
        selectedProjectId,
        selectedProject,
        setSelectedProjectId,
        isLoadingProjects,
        userRole,
        isInvestorUser,
        isDispatcherUser,
        isManagementUser
      }}
    >
      {children}
    </ProjectFilterContext.Provider>
  );
}

export function useProjectFilter(): ProjectFilterContextValue {
  const ctx = useContext(ProjectFilterContext);
  if (!ctx) {
    throw new Error('useProjectFilter must be used within a ProjectFilterProvider');
  }
  return ctx;
}
