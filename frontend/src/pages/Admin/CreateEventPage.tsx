import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEventContext } from '@/contexts/eventContext';
import { useTagContext } from '@/contexts/TagContext';
import type { Event } from '@/types/Event';

const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [registrationLink, setRegistrationLink] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [otherCategory, setOtherCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { createEvent } = useEventContext();
  const { tags, fetchTags } = useTagContext();

  useEffect(() => {
    if (tags.length === 0) void fetchTags();
  }, [tags.length, fetchTags]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title || !date) {
      setError('Please provide title and date');
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        title,
        description,
        date: new Date(date).toISOString(),
        location,
        registrationLink,
        imageUrl,
        tags: selectedTags,
      };

      if (category && category !== 'OTHER') payload.category = category;
      else if (category === 'OTHER' && otherCategory)
        payload.otherCategory = otherCategory;
      await createEvent(payload as Partial<Event>);
      navigate('/events');
    } catch (err) {
      console.error('Failed to create event', err);
      setError('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Create Event
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={4}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          type="datetime-local"
          label="Date"
          InputLabelProps={{ shrink: true }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Registration Link"
          value={registrationLink}
          onChange={(e) => setRegistrationLink(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="category-label">Category</InputLabel>
          <Select
            labelId="category-label"
            value={category}
            label="Category"
            onChange={(e) => setCategory(String(e.target.value))}
          >
            <MenuItem value="GENERAL">General</MenuItem>
            <MenuItem value="TECH_TALK">Tech Talk</MenuItem>
            <MenuItem value="WORKSHOP">Workshop</MenuItem>
            <MenuItem value="NETWORKING">Networking</MenuItem>
            <MenuItem value="COMMUNITY">Community</MenuItem>
            <MenuItem value="OTHER">Other</MenuItem>
          </Select>
        </FormControl>

        {category === 'OTHER' && (
          <TextField
            fullWidth
            label="Custom Category"
            value={otherCategory}
            onChange={(e) => setOtherCategory(e.target.value)}
            sx={{ mb: 2 }}
          />
        )}

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="tags-label">Tags</InputLabel>
          <Select
            labelId="tags-label"
            multiple
            value={selectedTags}
            onChange={(e) =>
              setSelectedTags(
                typeof e.target.value === 'string'
                  ? e.target.value.split(',')
                  : (e.target.value as string[])
              )
            }
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {selected.map((s) => (
                  <Chip key={s} label={s} size="small" />
                ))}
              </Box>
            )}
            label="Tags"
          >
            {tags.map((t) => (
              <MenuItem key={t.id} value={t.name}>
                {t.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create Event'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/admin')}>
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default CreateEventPage;
