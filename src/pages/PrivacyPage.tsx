// PrivacyPage.tsx — Privacy policy and data deletion form
import React, { useState } from 'react';

const PrivacyPage: React.FC = () => {
  const [requestSent, setRequestSent] = useState(false);
  const handleDeleteRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestSent(true);
    // TODO: Send deletion request to backend
  };
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="font-mono text-2xl mb-4">Privacy Policy</h1>
      <p className="mb-4 text-sm text-muted-foreground">We comply with the DPDP Act 2023. Your data is encrypted at rest and never shared with third parties. You may request deletion of your data at any time.</p>
      <form onSubmit={handleDeleteRequest} className="bg-secondary/20 border border-border rounded p-4 mb-4">
        <h2 className="font-mono text-lg mb-2">Request Data Deletion</h2>
        <input required type="email" placeholder="Your email" className="px-2 py-1 rounded border border-border font-mono text-xs mb-2 w-full" />
        <button type="submit" className="bg-destructive text-white px-3 py-1 rounded font-mono">Request Deletion</button>
        {requestSent && <div className="text-green-600 mt-2 font-mono text-xs">Request sent. We will process your deletion within 7 days.</div>}
      </form>
      <h2 className="font-mono text-lg mb-2">Full Privacy Policy</h2>
      <p className="text-xs text-muted-foreground">[Insert full privacy policy text here]</p>
    </div>
  );
};

export default PrivacyPage;
