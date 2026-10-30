import {
  Client,
  Project,
  MaterialItem,
  MasterQuarry,
  MasterVehicle,
  MasterDriver,
  DispatchTransaction
} from '@/types/database';

export interface ResolvedEntity {
  name: string;
  isOrphan: boolean;
  tooltipText?: string;
}

export interface ResolvedTransactionEntities {
  client: ResolvedEntity;
  project: ResolvedEntity;
  material: ResolvedEntity;
  quarry: ResolvedEntity;
  truck: ResolvedEntity;
  driver: ResolvedEntity;
}

/**
 * 1. Resolver Klien
 */
export function resolveClientName(
  clientId: string | undefined,
  fallbackName: string | undefined,
  clientsMap: Map<string, Client>
): ResolvedEntity {
  if (clientId && clientsMap.has(clientId)) {
    return {
      name: clientsMap.get(clientId)!.name,
      isOrphan: false
    };
  }
  const cleanFallback = fallbackName?.trim();
  if (cleanFallback) {
    return {
      name: cleanFallback,
      isOrphan: true,
      tooltipText: 'Master Klien tidak ditemukan atau telah dihapus'
    };
  }
  return { name: '-', isOrphan: false };
}

/**
 * 2. Resolver Proyek
 */
export function resolveProjectName(
  projectId: string | undefined,
  fallbackName: string | undefined,
  projectsMap: Map<string, Project>
): ResolvedEntity {
  if (projectId && projectsMap.has(projectId)) {
    return {
      name: projectsMap.get(projectId)!.name,
      isOrphan: false
    };
  }
  const cleanFallback = fallbackName?.trim();
  if (cleanFallback && cleanFallback !== 'Proyek Umum') {
    return {
      name: cleanFallback,
      isOrphan: true,
      tooltipText: 'Master Proyek tidak ditemukan atau telah dihapus'
    };
  }
  return { name: cleanFallback || 'Proyek Umum', isOrphan: false };
}

/**
 * 3. Resolver Material
 */
export function resolveMaterialName(
  materialId: string | undefined,
  fallbackName: string | undefined,
  materialsMap: Map<string, MaterialItem>
): ResolvedEntity {
  if (materialId && materialsMap.has(materialId)) {
    return {
      name: materialsMap.get(materialId)!.name,
      isOrphan: false
    };
  }
  const cleanFallback = fallbackName?.trim();
  if (cleanFallback) {
    return {
      name: cleanFallback,
      isOrphan: true,
      tooltipText: 'Master Material tidak ditemukan atau telah dihapus'
    };
  }
  return { name: '-', isOrphan: false };
}

/**
 * 4. Resolver Kuari Asal
 */
export function resolveQuarryName(
  quarryId: string | undefined,
  fallbackName: string | undefined,
  quarriesMap: Map<string, MasterQuarry>
): ResolvedEntity {
  if (quarryId && quarriesMap.has(quarryId)) {
    return {
      name: quarriesMap.get(quarryId)!.name,
      isOrphan: false
    };
  }
  const cleanFallback = fallbackName?.trim();
  if (cleanFallback && cleanFallback !== '-') {
    return {
      name: cleanFallback,
      isOrphan: true,
      tooltipText: 'Master Kuari tidak ditemukan atau telah dihapus'
    };
  }
  return { name: cleanFallback || '-', isOrphan: false };
}

/**
 * 5. Resolver Armada Truk
 */
export function resolveVehiclePlate(
  plate: string | undefined,
  vehiclesMap: Map<string, MasterVehicle>
): ResolvedEntity {
  if (!plate || !plate.trim()) {
    return { name: '-', isOrphan: false };
  }
  const normalizedKey = plate.replace(/\s+/g, '').toUpperCase();
  const found = vehiclesMap.get(normalizedKey);
  if (found) {
    return {
      name: found.plateNumber || plate.trim().toUpperCase(),
      isOrphan: false
    };
  }
  return {
    name: plate.trim().toUpperCase(),
    isOrphan: true,
    tooltipText: 'Armada belum terdaftar di Master Armada'
  };
}

/**
 * 6. Resolver Sopir
 */
export function resolveDriverName(
  driverName: string | undefined,
  driversMap: Map<string, MasterDriver>
): ResolvedEntity {
  if (!driverName || !driverName.trim()) {
    return { name: '', isOrphan: false };
  }
  const normalizedKey = driverName.trim().toLowerCase();
  const found = driversMap.get(normalizedKey);
  if (found) {
    return {
      name: found.name,
      isOrphan: false
    };
  }
  return {
    name: driverName.trim(),
    isOrphan: true,
    tooltipText: 'Sopir belum terdaftar di Master Sopir'
  };
}

/**
 * Resolver gabungan untuk 1 tiket ritase
 */
export function resolveTransactionEntities(
  tx: DispatchTransaction,
  maps: {
    clients: Map<string, Client>;
    projects: Map<string, Project>;
    materials: Map<string, MaterialItem>;
    quarries: Map<string, MasterQuarry>;
    vehicles: Map<string, MasterVehicle>;
    drivers: Map<string, MasterDriver>;
  }
): ResolvedTransactionEntities {
  return {
    client: resolveClientName(tx.clientId, tx.clientName || tx.customerName, maps.clients),
    project: resolveProjectName(tx.projectId, tx.projectName, maps.projects),
    material: resolveMaterialName(tx.materialId, tx.materialName, maps.materials),
    quarry: resolveQuarryName(tx.quarryId, tx.quarryName, maps.quarries),
    truck: resolveVehiclePlate(tx.truckPlate, maps.vehicles),
    driver: resolveDriverName(tx.driverName, maps.drivers)
  };
}

/**
 * 7. Resolver Nama Pembuat Laporan (Creator / Reported By)
 * Menampilkan nama akun ringkas: Fatih, Owner, Admin, Ops, atau nama akun investor/lainnya.
 */
export function resolveCreatorName(
  createdBy: string | undefined,
  usersMap?: Map<string, { name: string; email: string; role?: string }>
): string {
  if (!createdBy || !createdBy.trim()) return '-';
  const clean = createdBy.trim().toLowerCase();

  // 1. Mapping akun resmi sistem
  if (clean === 'fatih@patak.dev' || clean === 'fatih') return 'Fatih';
  if (clean === 'founder@patak.id' || clean === 'founder') return 'Owner';
  if (clean === 'administrator@patak.id' || clean === 'admin') return 'Admin';
  if (clean === 'opspatak.id@patak.id' || clean === 'ops' || clean.startsWith('ops')) return 'Ops';
  if (clean === 'yadi@patak.id') return 'Pak Yadi';

  // 2. Lookup ke usersMap jika tersedia
  if (usersMap) {
    const user = usersMap.get(clean) || usersMap.get(createdBy.trim());
    if (user) {
      if (user.role === 'founder') return 'Owner';
      if (user.role === 'developer') return 'Fatih';
      if (user.role === 'admin') return 'Admin';
      if (user.role === 'dispatcher') return 'Ops';
      if (user.name) return user.name;
    }
  }

  // 3. Fallback: Parse prefix email
  if (clean.includes('@')) {
    const prefix = clean.split('@')[0] || '';
    if (!prefix) return '-';
    const lowerPrefix = prefix.toLowerCase();
    if (lowerPrefix === 'admin' || lowerPrefix === 'administrator') return 'Admin';
    if (lowerPrefix === 'founder') return 'Owner';
    if (lowerPrefix.startsWith('ops')) return 'Ops';
    if (lowerPrefix === 'fatih') return 'Fatih';
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }

  return createdBy.trim();
}

