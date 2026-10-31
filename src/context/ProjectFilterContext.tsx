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
  lockedInvestorId: string | null;
  isInvestorUser: boolean;
  isDispatcherUser: boolean;
  isManagementUser: boolean;
  isWatcherUser: boolean;
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

  const isInvestorUser = userRole === 'investor';
  const isDispatcherUser = userRole === 'dispatcher';
  const isManagementUser = userRole === 'developer' || userRole === 'founder' || userRole === 'admin';
  const isWatcherUser = userRole === 'watcher' || userRole === 'viewer';

  // Isolasi data proyek: investor hanya bisa melihat proyek yang didanainya
  const visibleProjects = useMemo(() => {
    if (isInvestorUser && lockedInvestorId) {
      return projects.filter(p => p.investorId === lockedInvestorId);
    }
    return projects;
  }, [isInvestorUser, lockedInvestorId, projects]);

  // 3. Jika pengguna adalah role 'investor', kunci selectedProjectId ke proyek miliknya
  useEffect(() => {
    if (userRole === 'investor' && lockedInvestorId && visibleProjects.length > 0) {
      if (selectedProjectId !== 'ALL' && !visibleProjects.some(p => p.id === selectedProjectId)) {
        const firstProj = visibleProjects[0];
        if (firstProj) {
          setSelectedProjectId(firstProj.id);
        }
      }
    }
  }, [userRole, lockedInvestorId, visibleProjects, selectedProjectId]);

  const selectedProject = useMemo(() => {
    if (selectedProjectId === 'ALL') return null;
    return visibleProjects.find(p => p.id === selectedProjectId) || null;
  }, [selectedProjectId, visibleProjects]);

  return (
    <ProjectFilterContext.Provider
      value={{
        projects: visibleProjects,
        selectedProjectId,
        selectedProject,
        setSelectedProjectId,
        isLoadingProjects,
        userRole,
        lockedInvestorId,
        isInvestorUser,
        isDispatcherUser,
        isManagementUser,
        isWatcherUser
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
