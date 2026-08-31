import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Paper,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  FileUpload,
  CloudUpload,
  CheckCircle,
  ErrorOutline,
} from '@mui/icons-material';
import { importCsv } from '../../services/api';
import { ImportCsvResponse } from '../../types';

interface ImportCsvModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportCsvResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await importCsv(file);
      setResult(res);
      if (res.imported_count > 0) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'CSV Import failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={visible} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FileUpload sx={{ color: '#2563eb' }} />
        <span>Bulk Employee CSV Ingestion</span>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {error && <Alert severity="error">{error}</Alert>}

        {result && (
          <Alert
            severity={result.errors.length > 0 ? 'warning' : 'success'}
            icon={result.errors.length > 0 ? <ErrorOutline /> : <CheckCircle />}
          >
            Successfully imported <strong>{result.imported_count}</strong> records.
            {result.errors.length > 0 && ` Encountered ${result.errors.length} validation errors.`}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: '2px dashed #cbd5e1',
            borderRadius: 3,
            textAlign: 'center',
            bgcolor: '#f8fafc',
            cursor: 'pointer',
            '&:hover': { borderColor: '#2563eb', bgcolor: '#eff6ff' },
          }}
          component="label"
        >
          <input
            type="file"
            accept=".csv"
            hidden
            onChange={handleFileChange}
          />
          <CloudUpload sx={{ fontSize: 44, color: '#64748b', mb: 1 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
            {file ? file.name : 'Click to select or drag .csv file'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
            CSV must include: first_name, last_name, email, department, country, base_salary, currency
          </Typography>
        </Paper>

        {uploading && <LinearProgress sx={{ borderRadius: 1 }} />}

        {result && result.errors.length > 0 && (
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #fecaca', maxHeight: 180, overflowY: 'auto' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>
              Validation Errors ({result.errors.length})
            </Typography>
            <List dense>
              {result.errors.map((err, idx) => (
                <ListItem key={idx} disableGutters>
                  <ListItemText
                    primary={<Typography variant="caption" sx={{ color: '#b91c1c' }}>• Row {err.row}: {err.error}</Typography>}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={handleClose} sx={{ color: '#64748b', fontWeight: 600 }}>
          {result ? 'Done' : 'Cancel'}
        </Button>
        <Button
          variant="contained"
          disabled={!file || uploading}
          onClick={handleUpload}
          sx={{ fontWeight: 700 }}
        >
          {uploading ? 'Processing CSV...' : 'Start Import'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
