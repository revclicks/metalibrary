'use client'

import { Users, UserPlus, Shield, Mail, Crown } from 'lucide-react'

const DEMO_MEMBERS = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin', avatar: null, lastActive: '2 min ago' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'editor', avatar: null, lastActive: '1 hour ago' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'viewer', avatar: null, lastActive: '3 days ago' },
]

export default function TeamsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Team</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Manage your team members and permissions</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: 'var(--primary)' }}
        >
          <UserPlus size={16} />
          Invite Member
        </button>
      </div>

      {/* Upgrade prompt for free users */}
      <div
        className="rounded-xl p-6 text-center"
        style={{ background: 'var(--accent)', border: '1px solid var(--primary)30' }}
      >
        <Crown size={32} className="mx-auto mb-2" style={{ color: 'var(--primary)' }} />
        <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>Upgrade to Agency</h3>
        <p className="text-sm mt-1 mb-4" style={{ color: 'var(--muted)' }}>
          Team collaboration is available on the Agency plan. Add up to 10 team members.
        </p>
        <button className="rounded-lg px-6 py-2 text-sm font-medium text-white" style={{ background: 'var(--primary)' }}>
          Upgrade Now
        </button>
      </div>

      {/* Team Members */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-4 py-3" style={{ background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            Members ({DEMO_MEMBERS.length})
          </span>
        </div>
        {DEMO_MEMBERS.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between px-4 py-3"
            style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{member.name}</span>
                  {member.role === 'admin' && (
                    <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: 'var(--accent)', color: 'var(--primary)' }}>
                      Admin
                    </span>
                  )}
                </div>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>{member.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{member.lastActive}</span>
              <select
                defaultValue={member.role}
                className="rounded-lg px-3 py-1.5 text-xs"
                style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
