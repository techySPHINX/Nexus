import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import BlockIcon from "@mui/icons-material/Block";

// components/ConnectionActionButtons.tsx
interface ConnectionActionButtonsProps {
  connectionId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  onAccept?: (id: string, status: 'ACCEPTED') => void;
  onReject?: (id: string, status: 'REJECTED') => void;
  onBlock?: (id: string, status: 'BLOCKED') => void;
  onRemove?: (id: string) => void;
  onCancel?: (id: string) => void;
  loadingId?: string | null;
}

export const ConnectionActionButtons = ({
  connectionId,
  status,
  onAccept,
  onReject,
  onBlock,
  onRemove,
  onCancel,
  loadingId
}: ConnectionActionButtonsProps) => {
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  return (
    <>
      {status === 'PENDING' && onAccept && onReject && onBlock && (
        <>
          <Button 
            variant="contained" 
            startIcon={<CheckIcon />} 
            onClick={() => onAccept(connectionId, 'ACCEPTED')} 
            disabled={loadingId === `respond-${connectionId}`} 
            sx={{ mr: 1 }}
          >
            Accept
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<CloseIcon />} 
            onClick={() => onReject(connectionId, 'REJECTED')} 
            disabled={loadingId === `respond-${connectionId}`} 
            sx={{ mr: 1 }}
          >
            Reject
          </Button>
          <Button 
            variant="outlined" 
            color="secondary" 
            startIcon={<BlockIcon />} 
            onClick={() => setBlockDialogOpen(true)} 
            disabled={loadingId === `respond-${connectionId}`}
          >
            Block
          </Button>
        </>
      )}
      
      {status === 'ACCEPTED' && onRemove && (
        <Button 
          size="small" 
          color="error" 
          onClick={() => onRemove(connectionId)} 
          disabled={loadingId === `remove-${connectionId}`}
        >
          {loadingId === `remove-${connectionId}` ? 'Processing...' : 'Remove'}
        </Button>
      )}
      
      {status === 'PENDING' && onCancel && (
        <Button 
          variant="outlined" 
          color="error" 
          onClick={() => onCancel(connectionId)} 
          disabled={loadingId === `cancel-${connectionId}`}
        >
          {loadingId === `cancel-${connectionId}` ? 'Processing...' : 'Cancel'}
        </Button>
      )}
      
      <Dialog open={blockDialogOpen} onClose={() => setBlockDialogOpen(false)}>
        <DialogTitle>Confirm Block</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to block this user?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              onBlock?.(connectionId, 'BLOCKED');
              setBlockDialogOpen(false);
            }} 
            color="secondary" 
            autoFocus
          >
            Confirm Block
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};