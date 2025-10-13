import { useState, useRef } from "react";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
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
        reader.onload = (event) => {
            try {
                const jsonString = event.target?.result;
                if (typeof jsonString === "string") {
                    onUpload(jsonString);
                } else {
                    setErrorMessage('Error reading file content.');
                }
            } catch (error) {
                console.error('Error parsing JSON:', error);
                setErrorMessage('Invalid JSON format. Please check the file content.');
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

    return (
        <Dialog 
            open={open} 
            onClose={handleCloseDialog} 
            maxWidth="sm" 
            fullWidth
        >
            <DialogTitle>Upload Scenario</DialogTitle>
            <DialogContent>
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
                    <CloudUploadIcon fontSize="large" color="primary" style={{ marginBottom: 16 }} />
                    <Typography variant="body1" align="center" gutterBottom>
                        Drag and drop your scenario file here or click to browse
                    </Typography>
                    <Typography variant="body2" align="center" color="textSecondary">
                        Supports JSON files only
                    </Typography>
                    {selectedFile && (
                        <Typography variant="body2" style={{ marginTop: 16 }} color="primary">
                            Selected: {selectedFile.name}
                        </Typography>
                    )}
                </FileUploadDragBox>

                {errorMessage && (
                    <Typography color="error" variant="body2" style={{ marginTop: 16 }}>
                        {errorMessage}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button 
                    onClick={handleCloseDialog} 
                    color="primary"
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleUpload} 
                    color="primary" 
                    variant="contained" 
                    disabled={!selectedFile}
                >
                    Upload
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ScenarioUploadDialog;