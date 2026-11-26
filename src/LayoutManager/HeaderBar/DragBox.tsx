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
    border: `1.5px dashed ${isDragging ? theme.tokens.textMuted : theme.tokens.border}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: theme.tokens.textSecondary,
    backgroundColor: isDragging ? theme.tokens.controlFill : 'transparent',
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
    '&:hover': {
        backgroundColor: theme.tokens.controlFill,
        borderColor: theme.tokens.textMuted,
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