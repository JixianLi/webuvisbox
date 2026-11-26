import { useState, useRef } from "react";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTheme, type SxProps, type Theme } from '@mui/material/styles';
import { CloudUpload } from 'lucide-react';
import FileUploadDragBox from './DragBox';

interface ScenarioUploadDialogProps {
    open: boolean;
    onClose: () => void;
    onUpload: (jsonString: string) => void;
}

const ScenarioUploadDialog: React.FC<ScenarioUploadDialogProps> = ({ 
    open, 
    onClose, 
    onUpload 
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    
    // Create a ref for the file input
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const tokens = useTheme().tokens;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    };

    const handleFileSelection = (file: File) => {
        setErrorMessage('');
        // Check if file is JSON
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            setErrorMessage('Please select a valid JSON file.');
            return;
        }
        setSelectedFile(file);
    };

    const handleUpload = () => {
        if (!selectedFile) {
            setErrorMessage('Please select a file first.');
            return;
        }

        const reader = new FileReader();
        // The text is parsed and checked by the loader, which shows any error on screen.
        reader.onload = (event) => {
            const jsonString = event.target?.result;
            if (typeof jsonString === "string") {
                onUpload(jsonString);
            } else {
                setErrorMessage('Error reading file content.');
            }
        };

        reader.onerror = () => {
            setErrorMessage('Error reading file. Please try again.');
        };

        reader.readAsText(selectedFile);
    };

    const handleCloseDialog = () => {
        onClose();
        setSelectedFile(null);
        setErrorMessage('');
    };

    const dialogSx: SxProps<Theme> = {
        '& .MuiDialog-paper': {
            backgroundColor: tokens.surfaceRaised,
            border: `1px solid ${tokens.border}`,
            borderRadius: `${tokens.px(12)}px`,
        },
    };

    return (
        <Dialog
            open={open}
            onClose={handleCloseDialog}
            onKeyDown={event => event.stopPropagation()}
            maxWidth="xs"
            fullWidth
            sx={dialogSx}
        >
            <DialogTitle sx={{ fontSize: tokens.px(15), fontWeight: 600, pb: 1 }}>Upload Scenario</DialogTitle>
            <DialogContent sx={{ pt: 0.5 }}>
                <input
                    accept=".json"
                    style={{ display: 'none' }}
                    id="scenario-file-input"
                    type="file"
                    onChange={handleFileInputChange}
                    ref={fileInputRef}
                />
                <FileUploadDragBox
                    isDragging={isDragging}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => {
                        if (fileInputRef.current) {
                            fileInputRef.current.click();
                        }
                    }}
                >
                    <CloudUpload size={28} strokeWidth={1.75} style={{ marginBottom: 12 }} />
                    <Typography align="center" sx={{ fontSize: tokens.px(13), fontWeight: 500, color: tokens.text }}>
                        Drop a scenario file here, or click to choose one
                    </Typography>
                    <Typography align="center" sx={{ fontSize: tokens.px(12), color: tokens.textSecondary }}>
                        A .json scenario config
                    </Typography>
                    {selectedFile && (
                        <Typography sx={{ fontSize: tokens.px(13), mt: 1.5, color: tokens.accentOnSurface }}>
                            {selectedFile.name}
                        </Typography>
                    )}
                </FileUploadDragBox>

                {errorMessage && (
                    <Typography color="error" variant="body2" style={{ marginTop: 16 }}>
                        {errorMessage}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleCloseDialog} color="inherit" sx={{ color: tokens.textSecondary }}>
                    Cancel
                </Button>
                <Button onClick={handleUpload} color="primary" variant="contained" disabled={!selectedFile}>
                    Upload
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ScenarioUploadDialog;