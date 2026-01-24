import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { type RichTextEditorRef } from 'mui-tiptap';
import RichTextEditorWrapper from '@/utils/RichTextEditorWrapper';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useNews } from '@/contexts/NewsContext';
import { NewsItem } from '@/services/newsService';

// Local type compatible with mui-tiptap / tiptap image node attributes
type ImageNodeAttributes = {
  src: string;
  alt?: string;
  title?: string;
};

const AdminNews: React.FC = () => {
  const { news, loadNews, create, update, remove, loading, saving } = useNews();
  const [page] = useState(1);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState<Partial<NewsItem>>({ published: true });
  const [contentHtml, setContentHtml] = useState<string>(form.content || '');
  const rteRef = useRef<RichTextEditorRef>(null);
  // const editor = useRichTextEditorContext();

  useEffect(() => {
    loadNews(page, 50);
  }, [loadNews, page]);

  const onChange =
    (key: keyof NewsItem) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        e.target.type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setForm((f) => ({ ...f, [key]: value }));
    };

  const startEdit = (n: NewsItem) => {
    setEditing(n);
    setForm(n);
    setContentHtml(n.content || '');
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ published: true });
    setContentHtml('');
    if (rteRef.current?.editor) rteRef.current.editor.commands.setContent('');
  };

  const submit = async () => {
    try {
      const html = rteRef.current?.editor?.getHTML() ?? contentHtml;
      // Only send allowed fields to the backend — ValidationPipe forbids extras
      const payload: Partial<NewsItem> = {
        title: form.title as string | undefined,
        summary: form.summary as string | undefined,
        topic: form.topic as string | undefined,
        content: html,
        imageUrl: form.imageUrl as string | undefined,
        published:
          typeof form.published === 'boolean' ? form.published : undefined,
      };
      if (editing) {
        await update(editing.id, payload);
      } else {
        await create(payload);
      }
      await loadNews(page, 50);
      cancelEdit();
    } catch (err) {
      console.error('Failed to save news', err);
      // Could show a toast here
    }
  };

  // ensure we initialize editor innerHTML only when starting edit or creating
  useEffect(() => {
    if (rteRef.current?.editor) {
      rteRef.current.editor.commands.setContent(contentHtml || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const doDelete = async (id: string) => {
    if (!confirm('Delete this news item?')) return;
    try {
      await remove(id);
      await loadNews(page, 50);
    } catch (err) {
      console.error('Failed to delete news', err);
    }
  };

  // Handle image file uploads from the editor's upload button.
  // We create object URLs for preview/insertion. In production you may
  // want to upload to a server and return hosted URLs instead.
  const handleUploadFiles = async (
    files: File[]
  ): Promise<ImageNodeAttributes[]> => {
    const images: ImageNodeAttributes[] = Array.from(files).map((f) => ({
      src: URL.createObjectURL(f),
      alt: f.name,
    }));
    return images;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Admin: Manage News
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Title"
                fullWidth
                value={form.title || ''}
                onChange={onChange('title')}
              />
            </Grid>
            {/* slug is generated server-side now; do not collect on the frontend */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Topic"
                fullWidth
                value={form.topic || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, topic: e.target.value }))
                }
                helperText="Optional topic/category for this news item"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Image URL"
                fullWidth
                value={form.imageUrl || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, imageUrl: e.target.value }))
                }
                helperText="Optional absolute URL for the cover image"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Summary"
                fullWidth
                value={form.summary || ''}
                onChange={onChange('summary')}
              />
            </Grid>
            <Grid item xs={12}>
              <RichTextEditorWrapper
                ref={rteRef}
                value={contentHtml}
                onChange={(html) => setContentHtml(html)}
                onUploadFiles={handleUploadFiles}
                minHeight={260}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!form.published}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, published: e.target.checked }))
                    }
                  />
                }
                label="Published"
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" onClick={submit} disabled={saving}>
                {editing ? 'Update' : 'Create'}
              </Button>
              {editing && (
                <Button sx={{ ml: 2 }} onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {loading ? (
          <Typography>Loading news…</Typography>
        ) : (
          news.map((n) => (
            <Grid item xs={12} md={6} key={n.id}>
              <Card>
                <CardContent>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Box>
                      <Typography variant="h6">{n.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {n.slug} • {n.published ? 'Published' : 'Draft'}
                      </Typography>
                      {n.topic && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          Topic: {n.topic}
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      <IconButton
                        onClick={() => startEdit(n)}
                        aria-label="edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => doDelete(n.id)}
                        aria-label="delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography sx={{ mt: 1 }}>{n.summary}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default AdminNews;
