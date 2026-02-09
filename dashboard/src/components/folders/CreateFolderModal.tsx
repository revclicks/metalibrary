'use client'

import React, { useState } from 'react'
import type { Folder } from '@/types'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FolderPlus } from 'lucide-react'

interface CreateFolderModalProps {
  open: boolean
  onClose: () => void
  onCreate: (name: string, parentFolderId: string | null) => void
  folders: Folder[]
  loading?: boolean
}

export default function CreateFolderModal({
  open,
  onClose,
  onCreate,
  folders,
  loading = false,
}: CreateFolderModalProps) {
  const [name, setName] = useState('')
  const [parentFolderId, setParentFolderId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Folder name is required')
      return
    }
    onCreate(name.trim(), parentFolderId)
    setName('')
    setParentFolderId(null)
    setError('')
  }

  const handleClose = () => {
    setName('')
    setParentFolderId(null)
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Create New Folder" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Folder Name"
          placeholder="e.g., Q1 Campaigns"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          error={error}
          icon={<FolderPlus className="h-4 w-4" />}
          autoFocus
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Parent Folder (optional)
          </label>
          <select
            value={parentFolderId ?? ''}
            onChange={(e) =>
              setParentFolderId(e.target.value || null)
            }
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">None (top level)</option>
            {folders
              .filter((f) => !f.parentFolderId)
              .map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={<FolderPlus className="h-4 w-4" />}
          >
            Create Folder
          </Button>
        </div>
      </form>
    </Modal>
  )
}
