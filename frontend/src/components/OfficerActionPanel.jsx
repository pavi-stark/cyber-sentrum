import React, { useState } from 'react';
import { UserCheck, ShieldAlert, CheckCircle, XCircle, AlertOctagon, Send, FileSignature } from 'lucide-react';
import { api } from '../services/api';

export default function OfficerActionPanel({ sessionId, onDecisionMade }) {
  const [decision, setDecision] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');

  const handleAction = async (actionType) => {
    try {
      setSubmitting(true);
      await api.submitOfficerDecision(sessionId, actionType, notes);
      setDecision(actionType);
      setSubmittedMessage(`Officer decision '${actionType}' recorded in immutable audit log.`);
      if (onDecisionMade) onDecisionMade(actionType);
    } catch (err) {
      alert('Error recording decision: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
            <FileSignature className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Border Officer Final Decision Terminal
            </h3>
            <p className="text-xs text-slate-500">
              Human-in-the-loop verification & exception disposition
            </p>
          </div>
        </div>
        <div className="text-xs font-mono bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 text-slate-700 font-bold">
          SESSION: <span className="text-blue-600">{sessionId}</span>
        </div>
      </div>

      {submittedMessage ? (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3 text-emerald-800 text-sm">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          <div>
            <span className="font-bold">Decision Recorded: {decision}</span>
            <p className="text-xs text-emerald-700 mt-0.5">{submittedMessage}</p>
          </div>
        </div>
      ) : (
        <div>
          {/* Remarks Textarea */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Officer Inspection Notes & Audit Justification (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Passenger presented physical document; verified holograms and security watermark."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* 3 Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Approve */}
            <button
              disabled={submitting}
              onClick={() => handleAction('APPROVED')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center space-x-2 shadow-xs"
            >
              <CheckCircle className="h-4 w-4" />
              <span>APPROVE CLEARANCE</span>
            </button>

            {/* 2. Escalate / Secondary */}
            <button
              disabled={submitting}
              onClick={() => handleAction('ESCALATED')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition flex items-center justify-center space-x-2 shadow-xs"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>ESCALATE TO SECONDARY</span>
            </button>

            {/* 3. Reject */}
            <button
              disabled={submitting}
              onClick={() => handleAction('REJECTED')}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center space-x-2 shadow-xs"
            >
              <XCircle className="h-4 w-4" />
              <span>REJECT & INTERCEPT</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
