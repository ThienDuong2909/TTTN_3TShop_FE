import React, { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';

const UserStateTest: React.FC = () => {
  const { state } = useApp();
  const [localStorageUser, setLocalStorageUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('fashionhub-user');
    if (storedUser) {
      try {
        setLocalStorageUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing localStorage user:', error);
      }
    }
  }, []);

  return (
    <div className="p-4 bg-green-100 text-green-800 rounded-lg">
      <h3 className="font-bold mb-2">User State Test</h3>
      <div className="space-y-2 text-sm">
        <div>
          <strong>Context User:</strong>
          <pre className="mt-1 text-xs bg-white p-2 rounded">
            {JSON.stringify(state.user, null, 2)}
          </pre>
        </div>
        <div>
          <strong>LocalStorage User:</strong>
          <pre className="mt-1 text-xs bg-white p-2 rounded">
            {JSON.stringify(localStorageUser, null, 2)}
          </pre>
        </div>
        <div>
          <strong>Is Initialized:</strong> {state.isInitialized ? '✅ Yes' : '❌ No'}
        </div>
      </div>
    </div>
  );
};

export default UserStateTest; 