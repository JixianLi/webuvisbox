import Check from '@mui/icons-material/Check';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import { observer } from 'mobx-react-lite';
import { useScenario } from '@/ScenarioManager/ScenarioManager';


export const ViewMenuList = observer(() => {
    const scenario = useScenario();
    if (!scenario.initialized) {
        return <MenuItem key={"menu_item_key_loading"} onClick={() => {}}>
                <ListItemText>Loading...</ListItemText>
            </MenuItem>;
    }
    const panel_layouts = scenario?.panel_layouts!;
    const togglePanel = (panel_index: number) => {
        panel_layouts.toggle_visibility(panel_index);
    };

    const breakpoint = panel_layouts.current_breakpoint;
    const layout = panel_layouts.current_layouts[breakpoint];

    return layout.map((panel, idx) => {
        const onClick = () => togglePanel(idx);
        const visible = panel.visible;

        const displayed_item = (
            <>
                <ListItemIcon>{visible ? <Check /> : null}</ListItemIcon>
                <ListItemText>{panel.i}</ListItemText>
            </>
        );

        return (
            <MenuItem key={"menu_item_key_" + panel.i} onClick={onClick}>
                {displayed_item}
            </MenuItem>
        );
    });
});

export default ViewMenuList;