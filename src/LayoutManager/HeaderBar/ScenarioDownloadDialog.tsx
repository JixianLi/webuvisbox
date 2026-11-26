// ABOUTME: Dialog opened from the Scenario menu to let the user choose whether a downloaded scenario saves
// ABOUTME: the current panel layout or the scenario's saved default layout.

import { useState } from "react";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import { useTheme, type SxProps, type Theme } from '@mui/material/styles';
import type { ScenarioLayoutChoice } from '../../Types/Scenario';

interface ScenarioDownloadDialogProps {
    open: boolean;
    onClose: () => void;
    onDownload: (layout: ScenarioLayoutChoice) => void;
}

const LAYOUT_OPTIONS: Array<{ value: ScenarioLayoutChoice; title: string; description: string }> = [
    {
        value: 'current',
        title: 'Current layout',
        description: 'Save panel positions, sizes, and visibility as currently arranged.',
    },
    {
        value: 'default',
        title: 'Default layout',
        description: "Save the scenario's default panel arrangement.",
    },
];

const ScenarioDownloadDialog: React.FC<ScenarioDownloadDialogProps> = ({
    open,
    onClose,
    onDownload,
}) => {
    const tokens = useTheme().tokens;
    const [layoutChoice, setLayoutChoice] = useState<ScenarioLayoutChoice>('current');

    const handleClose = () => {
        onClose();
        setLayoutChoice('current');
    };

    const handleConfirm = () => {
        onDownload(layoutChoice);
        setLayoutChoice('current');
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
            onClose={handleClose}
            onKeyDown={event => event.stopPropagation()}
            maxWidth="xs"
            fullWidth
            sx={dialogSx}
        >
            <DialogTitle sx={{ fontSize: tokens.px(15), fontWeight: 600, pb: 1 }}>
                Download Scenario
            </DialogTitle>
            <DialogContent sx={{ pt: 0.5 }}>
                <Typography sx={{ fontSize: tokens.px(13), color: tokens.textSecondary, mb: 1.5 }}>
                    Choose which panel layout to include in the downloaded scenario file:
                </Typography>
                <RadioGroup
                    value={layoutChoice}
                    onChange={event => setLayoutChoice(event.target.value as ScenarioLayoutChoice)}
                    sx={{ gap: 1 }}
                >
                    {LAYOUT_OPTIONS.map(option => {
                        const selected = layoutChoice === option.value;
                        return (
                            <Box
                                key={option.value}
                                onClick={() => setLayoutChoice(option.value)}
                                sx={{
                                    border: `1px solid ${selected ? tokens.accentOnSurface : tokens.border}`,
                                    borderRadius: `${tokens.px(8)}px`,
                                    backgroundColor: selected ? tokens.controlFill : 'transparent',
                                    px: 1.25,
                                    py: 1,
                                    cursor: 'pointer',
                                }}
                            >
                                <FormControlLabel
                                    value={option.value}
                                    control={<Radio size="small" sx={{ py: 0.25 }} />}
                                    sx={{ alignItems: 'flex-start', width: '100%', m: 0 }}
                                    label={
                                        <Box sx={{ ml: 0.5 }}>
                                            <Typography sx={{ fontSize: tokens.px(13), fontWeight: 500, color: tokens.text }}>
                                                {option.title}
                                            </Typography>
                                            <Typography sx={{ fontSize: tokens.px(12), color: tokens.textSecondary }}>
                                                {option.description}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Box>
                        );
                    })}
                </RadioGroup>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} color="inherit" sx={{ color: tokens.textSecondary }}>
                    Cancel
                </Button>
                <Button onClick={handleConfirm} color="primary" variant="contained">
                    Download
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ScenarioDownloadDialog;
