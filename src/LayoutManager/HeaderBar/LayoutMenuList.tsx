import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import SaveIcon from '@mui/icons-material/Save';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';

import { observer } from "mobx-react-lite";
import { useScenario } from '../../ScenarioManager/ScenarioManager';

interface LayoutMenuListProps {
    handleClose: () => void;
}

export const LayoutMenuList: React.FC<LayoutMenuListProps> = observer(({ handleClose }) => {
    const scenario = useScenario();
    const panel_layouts = scenario.panel_layouts!;

    const saveDefaultLayout = () => {
        panel_layouts.saveDefaultLayouts();
        handleClose();
    }

    const resetLayout = () => {
        panel_layouts.resetToDefault();
        handleClose();
    }

    return (
        <>
            <MenuItem onClick={() => saveDefaultLayout()}>
                <ListItemIcon>
                    <SaveIcon />
                </ListItemIcon>
                <ListItemText primary="Save as Default Layout" />
            </MenuItem>
            <MenuItem onClick={resetLayout}>
                <ListItemIcon>
                    <SettingsBackupRestoreIcon />
                </ListItemIcon>
                <ListItemText primary="Reset Layout" />
            </MenuItem>
        </>
    )
});

export default LayoutMenuList;