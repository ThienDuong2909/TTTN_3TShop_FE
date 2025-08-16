import React from 'react';
import { useApp } from '../contexts/AppContext';
import { getPermissionsForRole } from '../utils/permissions';

const PermissionDebug: React.FC = () => {
  const { state } = useApp();
  const { user } = state;

  if (!user) {
    return <div className="p-4 bg-red-100 text-red-800">No user logged in</div>;
  }

  const expectedPermissions = getPermissionsForRole(user.role);

  return (
    <div className="p-4 bg-blue-100 text-blue-800 rounded-lg">
      <h3 className="font-bold mb-2">Permission Debug Info</h3>
      <div className="space-y-2 text-sm">
        <div>
          <strong>User ID:</strong> {user.id}
        </div>
        <div>
          <strong>Role:</strong> {user.role}
        </div>
        <div>
          <strong>Current Permissions:</strong>
          <ul className="ml-4 mt-1">
            {user.permissions?.map((perm, index) => (
              <li key={index} className="text-green-700">✓ {perm}</li>
            ))}
          </ul>
        </div>
        <div>
          <strong>Expected Permissions for {user.role}:</strong>
          <ul className="ml-4 mt-1">
            {expectedPermissions.map((perm, index) => (
              <li key={index} className={user.permissions?.includes(perm) ? 'text-green-700' : 'text-red-700'}>
                {user.permissions?.includes(perm) ? '✓' : '✗'} {perm}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PermissionDebug; 