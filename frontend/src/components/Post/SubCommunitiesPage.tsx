import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useSubCommunities } from '../../contexts/SubCommunityContext';
import { Link } from 'react-router-dom';

export const SubCommunitiesPage: React.FC = () => {
  const {
    subCommunities,
    loading,
    createSubCommunity,
  } = useSubCommunities();
  const [openDialog, setOpenDialog] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    try {
      await createSubCommunity({ name, description });
      setOpenDialog(false);
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Error creating sub-community:', error);
    }
  };

  return (
    <Box sx={{ maxWidth: '800px', margin: '0 auto', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Sub-Communities</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          Create New
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : subCommunities.length === 0 ? (
        <Typography variant="body1">No sub-communities found.</Typography>
      ) : (
        <List sx={{ bgcolor: 'background.paper' }}>
          {subCommunities.map((subCommunity) => (
            <React.Fragment key={subCommunity.id}>
              <ListItem
                alignItems="flex-start"
                component={Link}
                to={`/subcommunities/${subCommunity.id}`}
                sx={{ textDecoration: 'none', color: 'inherit' }}
              >
                <ListItemText
                  primary={subCommunity.name}
                  secondary={subCommunity.description}
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
      
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Sub-Community</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || !description.trim()}
            variant="contained"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};