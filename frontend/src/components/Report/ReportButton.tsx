import React, { useState } from 'react';
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import { useNotification } from '@/contexts/NotificationContext';
import reportServices from '@/services/reportServices';
import { useReportContext } from '@/contexts/reportContext';
import { CreateReportDto } from '@/types/Report';

interface Props {
  type: 'POST' | 'COMMENT' | 'OTHER';
  postId?: string;
  commentId?: string;
}

const ReportButton: React.FC<Props> = ({ type, postId, commentId }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { showNotification } = useNotification();
  const { createReport } = useReportContext();

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setReason('');
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const onMenuReport = () => {
    handleMenuClose();
    handleOpen();
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      showNotification?.('Please enter a reason', 'error');
      return;
    }

    const dto: CreateReportDto = {
      type,
      reason: reason.trim(),
      ...(postId ? { postId } : {}),
      ...(commentId ? { commentId } : {}),
    } as CreateReportDto;

    try {
      // Prefer context createReport so cache updates
      if (createReport) {
        await createReport(dto);
      } else {
        await reportServices.createReport(dto);
      }
      showNotification?.('Report submitted', 'success');
      handleClose();
    } catch (err) {
      console.error(err);
      showNotification?.('Failed to submit report', 'error');
    }
  };

  return (
    <>
      <Tooltip title="More">
        <IconButton aria-label="more" size="small" onClick={handleMenuOpen}>
          <MoreVert fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={onMenuReport}>Report</MenuItem>
      </Menu>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Report {type.toLowerCase()}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Reason"
            type="text"
            fullWidth
            multiline
            minRows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReportButton;
