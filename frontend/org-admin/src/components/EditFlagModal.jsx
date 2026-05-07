import React, { useState } from 'react';

console.log('Loading Edit Flag Modal component...');

function EditFlagModal({ flag, onSave, onClose }) {
  const [formData, setFormData] = useState({
    key: flag.key,
    enabled: flag.enabled
  });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Saving flag changes...');
    
    if (!formData.key.trim()) {
      alert('Feature flag key cannot be empty');
      return;
    }

    setSaving(true);
    
    try {
      await onSave(flag.id, formData);
      console.log('Flag saved successfully');
    } catch (error) {
      console.error('Error saving flag:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Feature Flag</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="edit-key">Flag Key</label>
            <input
              type="text"
              id="edit-key"
              name="key"
              value={formData.key}
              onChange={handleInputChange}
              disabled={saving}
              style={{ 
                width: '100%', 
                padding: '0.8rem', 
                border: '2px solid #ddd', 
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="enabled"
                checked={formData.enabled}
                onChange={handleInputChange}
                disabled={saving}
              />
              Feature is enabled
            </label>
          </div>
          
          <div className="modal-actions">
            <button 
              type="button" 
              className="modal-btn secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="modal-btn primary"
              disabled={saving || !formData.key.trim()}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditFlagModal;