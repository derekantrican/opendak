import { IconButton, List, ListItem, ListItemText, Typography, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function WidgetList({ widgets, onEdit, onDelete }) {
  if (!widgets || widgets.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        No widgets configured. Click "Add Widget" to get started.
      </Typography>
    );
  }

  return (
    <List dense>
      {widgets.map((widget, index) => (
        <ListItem
          key={widget.id}
          secondaryAction={
            <div>
              <IconButton edge="end" onClick={() => onEdit(index)} size="small">
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton edge="end" onClick={() => onDelete(index)} size="small">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </div>
          }
        >
          <ListItemText
            primary={widget.title || `${widget.type} widget`}
            secondary={
              <Chip label={widget.type} size="small" variant="outlined" sx={{ mt: 0.5 }} />
            }
          />
        </ListItem>
      ))}
    </List>
  );
}
