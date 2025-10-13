import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

export interface DragBoxProps {
    isDragging?: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onClick: () => void;
    children: React.ReactNode;
}

const DragBox = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'isDragging'
})<{ isDragging?: boolean }>(({ theme, isDragging }) => ({
    border: isDragging ? '2px dashed #aaa' : '2px dashed #ddd',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: isDragging ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
    transition: 'all 0.3s ease',
    '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
        borderColor: theme.palette.primary.light
    },
    minHeight: '150px'
}));

const FileUploadDragBox: React.FC<DragBoxProps> = ({
    isDragging,
    onDragOver,
    onDragLeave,
    onDrop,
    onClick,
    children
}) => {
    return (
        <DragBox
            isDragging={isDragging}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={onClick}
        >
            {children}
        </DragBox>
    );
};

export default FileUploadDragBox;