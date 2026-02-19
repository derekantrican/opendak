import { useEffect, useState } from 'react';
import {
  TextField, Select, MenuItem, FormControl, InputLabel,
  Checkbox, FormControlLabel, Button, Typography, IconButton,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { getBaseFields, getFieldsForType, getDescriptionForType, WIDGET_TYPES, createWidget } from '../../models/settingsSchema';
import { isValidJSON } from '../../utils/jsonUtils';

function CalendarListEditor({ value, onChange }) {
  const calendars = value || [];

  const handleAdd = () => {
    onChange([...calendars, { url: '', color: '#1976d2' }]);
  };

  const handleRemove = (index) => {
    onChange(calendars.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, newValue) => {
    const updated = calendars.map((cal, i) =>
      i === index ? { ...cal, [field]: newValue } : cal
    );
    onChange(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Typography variant="subtitle2">Calendars</Typography>
      {calendars.map((cal, index) => (
        <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <TextField
            label="iCal URL"
            value={cal.url}
            onChange={(e) => handleChange(index, 'url', e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Color"
            type="color"
            value={cal.color}
            onChange={(e) => handleChange(index, 'color', e.target.value)}
            size="small"
            sx={{ width: 80 }}
          />
          <IconButton onClick={() => handleRemove(index)} size="small">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </div>
      ))}
      <Button startIcon={<AddIcon />} onClick={handleAdd} size="small" variant="outlined">
        Add Calendar
      </Button>
    </div>
  );
}

function FieldRenderer({ field, value, onChange }) {
  if (field.type === 'calendar-list') {
    return <CalendarListEditor value={value} onChange={onChange} />;
  }

  if (field.type === 'checkbox') {
    return (
      <FormControlLabel
        control={
          <Checkbox
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            size="small"
          />
        }
        label={field.label}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <FormControl size="small" fullWidth>
        <InputLabel>{field.label}</InputLabel>
        <Select
          value={value ?? field.default ?? ''}
          label={field.label}
          onChange={(e) => onChange(e.target.value)}
        >
          {field.options.map(opt => (
            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  if (field.type === 'textarea') {
    const raw = value ?? field.default ?? '';
    const jsonInvalid = raw !== '' && !isValidJSON(raw);
    return (
      <TextField
        label={field.label}
        value={raw}
        onChange={(e) => onChange(e.target.value)}
        size="small"
        multiline
        minRows={2}
        placeholder={field.placeholder}
        error={jsonInvalid}
        helperText={jsonInvalid ? 'Invalid JSON — value will be ignored' : undefined}
        fullWidth
      />
    );
  }

  // Default: text input
  return (
    <TextField
      label={field.label}
      value={value ?? field.default ?? ''}
      onChange={(e) => onChange(e.target.value)}
      size="small"
      placeholder={field.placeholder}
      fullWidth
    />
  );
}

export default function WidgetEditor({ widget, onChange, onCancel, isNew, onUpdate }) {
  const [localWidget, setLocalWidget] = useState({ ...widget });

  // Keep parent in sync so it can access current state for the pinned Save button
  useEffect(() => {
    if (onUpdate) onUpdate(localWidget);
  }, [localWidget]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFieldChange = (key, value) => {
    setLocalWidget(prev => ({ ...prev, [key]: value }));
  };

  const handleTypeChange = (newType) => {
    // When type changes, create fresh widget with new type defaults but preserve base fields
    const fresh = createWidget(newType);
    const baseFieldKeys = getBaseFields().map(f => f.key);
    const preserved = {};
    for (const key of baseFieldKeys) {
      if (localWidget[key] !== undefined) {
        preserved[key] = localWidget[key];
      }
    }
    setLocalWidget({ ...fresh, ...preserved, id: localWidget.id });
  };

  const baseFields = getBaseFields();
  const typeFields = getFieldsForType(localWidget.type).filter(field => {
    if (!field.visibleWhen) return true;
    return Object.entries(field.visibleWhen).every(([key, val]) => localWidget[key] === val);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Typography variant="h6">{isNew ? 'Add Widget' : 'Edit Widget'}</Typography>

      {/* Widget type selector */}
      <FormControl size="small" fullWidth>
        <InputLabel>Widget Type</InputLabel>
        <Select
          value={localWidget.type || ''}
          label="Widget Type"
          onChange={(e) => handleTypeChange(e.target.value)}
          disabled={!isNew}
        >
          {Object.entries(WIDGET_TYPES).map(([key, value]) => (
            <MenuItem key={value} value={value}>
              {key.charAt(0) + key.slice(1).toLowerCase()}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {getDescriptionForType(localWidget.type) && (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {getDescriptionForType(localWidget.type)}
        </Typography>
      )}

      <Divider />
      <Typography variant="subtitle2" color="text.secondary">Layout & Appearance</Typography>

      {baseFields.map(field => (
        <FieldRenderer
          key={field.key}
          field={field}
          value={localWidget[field.key]}
          onChange={(val) => handleFieldChange(field.key, val)}
        />
      ))}

      {typeFields.length > 0 && (
        <>
          <Divider />
          <Typography variant="subtitle2" color="text.secondary">Widget Settings</Typography>
        </>
      )}

      {typeFields.map(field => (
        <FieldRenderer
          key={field.key}
          field={field}
          value={localWidget[field.key]}
          onChange={(val) => handleFieldChange(field.key, val)}
        />
      ))}
    </div>
  );
}
