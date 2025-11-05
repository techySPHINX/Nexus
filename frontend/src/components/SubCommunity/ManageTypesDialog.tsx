import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import { subCommunityService } from '../../services/subCommunityService';
import { SubCommunityType } from '../../types/subCommunity';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ManageTypesDialog: React.FC<Props> = ({ open, onClose }) => {
  const [types, setTypes] = useState<SubCommunityType[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const t = await subCommunityService.getTypes();
      setTypes(t);
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await subCommunityService.createType({ name: newName.toUpperCase() });
      setNewName('');
      await load();
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await subCommunityService.deleteType(id);
      await load();
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage Community Types</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Type name (e.g. TECH)"
            value={newName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewName(e.target.value)
            }
          />
          <Button
            onClick={handleCreate}
            variant="contained"
            startIcon={<Add />}
            disabled={loading}
          >
            Add
          </Button>
        </Box>

        <List>
          {types.map((t) => (
            <ListItem
              key={t.id}
              secondaryAction={
                <IconButton
                  edge="end"
                  onClick={() => handleDelete(t.id)}
                  disabled={loading}
                >
                  <Delete />
                </IconButton>
              }
            >
              <ListItemText primary={t.name} secondary={t.description} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
