import { useState } from 'react';
import {
  Drawer, IconButton, Button, Divider, Typography, Tabs, Tab, Box,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import GitHubIcon from '@mui/icons-material/GitHub';
import GlobalSettingsForm from './settings/GlobalSettingsForm';
import WidgetList from './settings/WidgetList';
import WidgetEditor from './settings/WidgetEditor';
import { createWidget, WIDGET_TYPES } from '../models/settingsSchema';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

export default function SettingsPanel({ settings, onSettingsChange }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [editingWidgetIndex, setEditingWidgetIndex] = useState(null); // null = list view, -1 = new widget, >= 0 = editing
  const [editingWidget, setEditingWidget] = useState(null);

  const handleGlobalChange = (newGlobal) => {
    const updated = { ...settings, global: newGlobal };
    onSettingsChange(updated);
  };

  const handleAddWidget = () => {
    const newWidget = createWidget(WIDGET_TYPES.CLOCK);
    setEditingWidget(newWidget);
    setEditingWidgetIndex(-1);
  };

  const handleEditWidget = (index) => {
    setEditingWidget({ ...settings.widgets[index] });
    setEditingWidgetIndex(index);
  };

  const handleDeleteWidget = (index) => {
    const updated = {
      ...settings,
      widgets: settings.widgets.filter((_, i) => i !== index),
    };
    onSettingsChange(updated);
  };

  const handleWidgetSave = (widget) => {
    let updatedWidgets;
    if (editingWidgetIndex === -1) {
      // Adding new
      updatedWidgets = [...(settings.widgets || []), widget];
    } else {
      // Editing existing
      updatedWidgets = settings.widgets.map((w, i) =>
        i === editingWidgetIndex ? widget : w
      );
    }

    onSettingsChange({ ...settings, widgets: updatedWidgets });
    setEditingWidgetIndex(null);
    setEditingWidget(null);
  };

  const handleWidgetCancel = () => {
    setEditingWidgetIndex(null);
    setEditingWidget(null);
  };

  const handleExport = () => {
    const json = JSON.stringify(settings, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'opendak-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (imported.global && imported.widgets) {
            onSettingsChange(imported);
          }
        } catch {
          alert('Invalid settings file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleDemo = () => {
    const demoSettings = {
      global: {
        backgroundSubreddit: 'EarthPorn',
        backgroundTransition: false,
        corsProxy: { url: '', headers: '{}' },
      },
      widgets: [
        {
          id: 'demo-clock',
          type: 'clock',
          title: '',
          textAlign: 'left',
          backgroundColor: '',
          fontSize: 'large',
          x: 'center',
          y: 'center',
          width: '',
          height: '',
          timezone: 'local',
          format: '24h',
          showSeconds: true,
          showDate: true,
        },
        {
          id: 'demo-weather',
          type: 'weather',
          title: '',
          textAlign: 'left',
          backgroundColor: 'rgba(134, 122, 122, 0.36)',
          fontSize: 'medium',
          x: '0px',
          y: 'bottom:0px',
          width: '600px',
          height: '200px',
          provider: 'openmeteo',
          lat: '40.7128',
          lon: '-74.006',
          units: 'imperial',
          forecastDays: '4',
        },
        {
          id: 'demo-calendar',
          type: 'calendar',
          title: '',
          textAlign: 'left',
          backgroundColor: 'rgba(134, 122, 122, 0.36)',
          fontSize: 'medium',
          x: 'right:0px',
          y: 'bottom:0px',
          width: '24%',
          height: '35%',
          calendars: [
            {
              url: 'https://calendar.google.com/calendar/ical/en.usa%23holiday%40group.v.calendar.google.com/public/basic.ics',
              color: '#4285F4',
            },
            {
              url: window.location.origin + '/demo.ics',
              color: '#F4B400',
            },
          ],
        },
      ],
    };
    onSettingsChange(demoSettings);
  };

  return (
    <>
      {/* Gear icon — fixed in top-right corner */}
      <IconButton
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          top: 8,
          right: 8,
          zIndex: 1300,
          opacity: 0.3,
          '&:hover': { opacity: 1 },
          transition: 'opacity 0.3s',
          color: 'white',
        }}
      >
        <SettingsIcon />
      </IconButton>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => { setOpen(false); setEditingWidgetIndex(null); setEditingWidget(null); }}
        PaperProps={{ sx: { width: 400, p: 2, display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', overflow: 'hidden' } }}
      >
        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>OpenDak Settings</Typography>

          {/* Import / Export */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <Button startIcon={<FileDownloadIcon />} onClick={handleExport} size="small" variant="outlined">
              Export
            </Button>
            <Button startIcon={<FileUploadIcon />} onClick={handleImport} size="small" variant="outlined">
              Import
            </Button>
            <Button startIcon={<PlayArrowIcon />} onClick={handleDemo} size="small" variant="outlined">
              Demo
            </Button>
          </div>

          <Divider />

          <Tabs value={tab} onChange={(_, v) => { setTab(v); setEditingWidgetIndex(null); setEditingWidget(null); }} sx={{ mb: 1 }}>
            <Tab label="Global" />
            <Tab label="Widgets" />
          </Tabs>

          {/* Global tab */}
          <TabPanel value={tab} index={0}>
            <GlobalSettingsForm
              globalSettings={settings.global}
              onChange={handleGlobalChange}
            />
          </TabPanel>

          {/* Widgets tab */}
          <TabPanel value={tab} index={1}>
            {editingWidgetIndex !== null && editingWidget ? (
              <WidgetEditor
                widget={editingWidget}
                onChange={handleWidgetSave}
                onCancel={handleWidgetCancel}
                isNew={editingWidgetIndex === -1}
                onUpdate={setEditingWidget}
              />
            ) : (
              <>
                <Button
                  variant="contained"
                  onClick={handleAddWidget}
                  size="small"
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Add Widget
                </Button>
                <WidgetList
                  widgets={settings.widgets}
                  onEdit={handleEditWidget}
                  onDelete={handleDeleteWidget}
                />
              </>
            )}
          </TabPanel>
        </Box>

        {/* Pinned Save/Cancel bar when editing a widget */}
        {editingWidgetIndex !== null && editingWidget && (
          <Box sx={{ display: 'flex', gap: 1, pt: 1.5, pb: 0.5, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
            <Button variant="contained" onClick={() => handleWidgetSave(editingWidget)} size="small">
              {editingWidgetIndex === -1 ? 'Add' : 'Save'}
            </Button>
            <Button variant="outlined" onClick={handleWidgetCancel} size="small">
              Cancel
            </Button>
          </Box>
        )}

        {/* Footer links — hidden when editing a widget */}
        {editingWidgetIndex === null && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, pt: 1.5, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
            <IconButton
              component="a"
              href="https://github.com/derekantrican/opendak"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              disableRipple
              sx={{ '&:hover': { backgroundColor: 'transparent' } }}
            >
              <GitHubIcon sx={{ fontSize: 32 }} />
            </IconButton>
            <IconButton
              component="a"
              href="https://ko-fi.com/derekantrican"
              target="_blank"
              rel="noopener noreferrer"
              title="Support on Ko-fi"
              disableRipple
              sx={{ '&:hover': { backgroundColor: 'transparent' } }}
            >
              <img src="https://storage.ko-fi.com/cdn/kofi6.png?v=6" alt="Ko-fi" style={{ height: 36 }} />
            </IconButton>
          </Box>
        )}
      </Drawer>
    </>
  );
}
