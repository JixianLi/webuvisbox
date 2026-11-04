import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import { RotateCcw, Save } from 'lucide-react';

import { observer } from "mobx-react-lite";
import { useScenario } from '../../ScenarioManager/ScenarioManager';

interface LayoutMenuListProps {
    handleClose: () => void;
}

export const LayoutMenuList: React.FC<LayoutMenuListProps> = observer(({ handleClose }) => {
    const scenario = useScenario();
    const panelLayouts = scenario.panelLayouts!;

    const saveDefaultLayout = () => {
        panelLayouts.saveDefaultLayouts();
        handleClose();
    }

    const resetLayout = () => {
        panelLayouts.resetToDefault();
        handleClose();
    }

    return (
        <>
            <MenuItem onClick={() => saveDefaultLayout()}>
                <ListItemIcon>
                    <Save size={16} strokeWidth={1.75} />
                </ListItemIcon>
                <ListItemText primary="Save as Default Layout" />
            </MenuItem>
            <MenuItem onClick={resetLayout}>
                <ListItemIcon>
                    <RotateCcw size={16} strokeWidth={1.75} />
                </ListItemIcon>
                <ListItemText primary="Reset Layout" />
            </MenuItem>
        </>
    )
});

export default LayoutMenuList;