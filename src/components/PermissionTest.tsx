import React from 'react';
import { useApp } from '../contexts/AppContext';
import { getPermissionsForRole, hasAnyPermission } from '../utils/permissions';

const PermissionTest: React.FC = () => {
  const { state } = useApp();
  const { user } = state;

  if (!user) {
    return <div className="p-4 bg-red-100 text-red-800">No user logged in</div>;
  }

  const expectedPermissions = getPermissionsForRole(user.role);
  const dashboardPermissions = ['toanquyen', 'donhang.xem_duoc_giao', 'donhang.xem'];
  const hasDashboardAccess = hasAnyPermission(user.permissions || [], dashboardPermissions);

  return (
    <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg">
      <h3 className="font-bold mb-2">Permission Test for Dashboard Access</h3>
      <div className="space-y-2 text-sm">
        <div>
          <strong>User Role:</strong> {user.role}
        </div>
        <div>
          <strong>Dashboard Access:</strong> {hasDashboardAccess ? '✅ YES' : '❌ NO'}
        </div>
        <div>
          <strong>Required for Dashboard:</strong>
          <ul className="ml-4 mt-1">
            {dashboardPermissions.map((perm, index) => (
              <li key={index} className={user.permissions?.includes(perm) ? 'text-green-700' : 'text-red-700'}>
                {user.permissions?.includes(perm) ? '✓' : '✗'} {perm}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <strong>User Permissions:</strong>
          <ul className="ml-4 mt-1">
            {user.permissions?.map((perm, index) => (
              <li key={index} className="text-green-700">✓ {perm}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PermissionTest; 