import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import BrutalistButton from '../ui/BrutalistButton';
import { Link } from 'react-router-dom';

export function AdminSetupGuide() {
  const { user } = useAuth();
  const [showGuide, setShowGuide] = useState(false);

  if (!user) return null;

  return (
    <div className="bg-yellow-100 border-4 border-black p-6 shadow-brutal mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          🔑 Want Admin Access?
        </h3>
        <BrutalistButton
          onClick={() => setShowGuide(!showGuide)}
          className="text-sm"
        >
          {showGuide ? 'Hide Guide' : 'Show Guide'}
        </BrutalistButton>
      </div>

      {showGuide && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-black p-4">
            <h4 className="font-bold mb-2">📋 To Become an Admin:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <strong>Go to Firebase Console:</strong>{' '}
                <a 
                  href="https://console.firebase.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:bg-yellow-200"
                >
                  console.firebase.google.com
                </a>
              </li>
              <li><strong>Select your EPLQ project</strong> (your-project-id)</li>
              <li><strong>Go to Firestore Database</strong></li>
              <li><strong>Find userProfiles collection</strong></li>
              <li><strong>Locate your user:</strong> {user.email}</li>
              <li><strong>Edit the document</strong></li>
              <li><strong>Change role field:</strong> "user" → "admin"</li>
              <li><strong>Save changes</strong></li>
              <li><strong>Refresh this page</strong></li>
            </ol>
          </div>

          <div className="bg-blue-100 border-2 border-black p-4">
            <h4 className="font-bold mb-2">⚡ Quick Copy-Paste:</h4>
            <div className="bg-gray-100 p-2 border border-gray-400 font-mono text-sm">
              <div className="mb-2">
                <strong>Collection:</strong> userProfiles
              </div>
              <div className="mb-2">
                <strong>Document ID:</strong> {user.uid}
              </div>
              <div className="mb-2">
                <strong>Field to change:</strong> role
              </div>
              <div>
                <strong>New value:</strong> "admin"
              </div>
            </div>
          </div>

          <div className="bg-green-100 border-2 border-black p-4">
            <h4 className="font-bold mb-2">🎯 After Setup:</h4>
            <div className="space-y-2">
              <div>✅ Visit <Link to="/admin" className="text-blue-600 underline font-mono">/admin</Link> for full dashboard</div>
              <div>✅ Manage user roles in Role Management tab</div>
              <div>✅ Upload POI data and view system stats</div>
              <div>✅ Control all aspects of the EPLQ system</div>
            </div>
          </div>

          <div className="bg-red-100 border-2 border-black p-4">
            <h4 className="font-bold mb-2">⚠️ Important Notes:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Role changes require Firebase Console access</li>
              <li>Admin access includes viewing encrypted data</li>
              <li>Admins can promote/demote other users</li>
              <li>Changes take effect immediately after save</li>
            </ul>
          </div>

          <div className="flex gap-4 pt-4">
            <BrutalistButton
              onClick={() => window.open('https://console.firebase.google.com', '_blank')}
              className="bg-blue-500 hover:bg-blue-400"
            >
              🚀 Open Firebase Console
            </BrutalistButton>
            <BrutalistButton
              onClick={() => window.location.reload()}
              className="bg-green-500 hover:bg-green-400"
            >
              🔄 Refresh Page
            </BrutalistButton>
          </div>
        </div>
      )}
    </div>
  );
}
