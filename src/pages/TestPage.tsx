import React from 'react';
import { useApp } from '../contexts/AppContext';
import { hasAnyPermission } from '../utils/permissions';

const TestPage: React.FC = () => {
  const { state } = useApp();
  const { user } = state;

  const dashboardPermissions = ['toanquyen', 'donhang.xem_duoc_giao', 'donhang.xem'];
  const hasDashboardAccess = hasAnyPermission(user?.permissions || [], dashboardPermissions);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Test Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-100 rounded-lg">
          <h2 className="font-bold mb-2">User Info</h2>
          <p><strong>Role:</strong> {user?.role}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Name:</strong> {user?.name}</p>
        </div>

        <div className="p-4 bg-green-100 rounded-lg">
          <h2 className="font-bold mb-2">Permissions</h2>
          <ul className="list-disc list-inside">
            {user?.permissions?.map((perm, index) => (
              <li key={index}>{perm}</li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-yellow-100 rounded-lg">
          <h2 className="font-bold mb-2">Dashboard Access Test</h2>
          <p><strong>Required permissions:</strong> {dashboardPermissions.join(', ')}</p>
          <p><strong>Has access:</strong> {hasDashboardAccess ? '✅ YES' : '❌ NO'}</p>
        </div>

        <div className="p-4 bg-purple-100 rounded-lg">
          <h2 className="font-bold mb-2">Navigation Test</h2>
          <a 
            href="/admin" 
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go to Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

export default TestPage; 