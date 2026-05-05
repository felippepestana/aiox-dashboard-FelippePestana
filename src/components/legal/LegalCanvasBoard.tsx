'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

export interface CanvasSection {
  key: string;
  title: string;
  items: string[];
}

export interface LegalCanvasBoardProps {
  sections: CanvasSection[];
  onAddItem: (sectionKey: string, item: string) => void;
  onRemoveItem: (sectionKey: string, index: number) => void;
}

export function LegalCanvasBoard({ sections, onAddItem, onRemoveItem }: LegalCanvasBoardProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');

  function handleAdd(sectionKey: string) {
    if (newItemText.trim()) {
      onAddItem(sectionKey, newItemText.trim());
      setNewItemText('');
      setEditingSection(null);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sections.map((section) => (
        <div
          key={section.key}
          className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4 flex flex-col"
        >
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
            {section.title}
          </h3>

          <div className="flex-1 space-y-2 mb-3">
            {section.items.length === 0 && (
              <p className="text-xs text-[#6b7a8d] italic">Nenhum item adicionado</p>
            )}
            {section.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-2 rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 group"
              >
                <span className="text-sm text-white flex-1">{item}</span>
                <button
                  onClick={() => onRemoveItem(section.key, idx)}
                  className="text-[#6b7a8d] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          {editingSection === section.key ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd(section.key);
                  if (e.key === 'Escape') {
                    setEditingSection(null);
                    setNewItemText('');
                  }
                }}
                placeholder="Novo item..."
                className="flex-1 rounded-lg bg-[#0a0f1a] border border-amber-500/30 px-3 py-1.5 text-sm text-white placeholder-[#6b7a8d] focus:outline-none focus:border-amber-500"
                autoFocus
              />
              <button
                onClick={() => handleAdd(section.key)}
                className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/30 transition-colors"
              >
                OK
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditingSection(section.key);
                setNewItemText('');
              }}
              className="flex items-center gap-1.5 text-xs text-[#6b7a8d] hover:text-amber-400 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Adicionar item
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
