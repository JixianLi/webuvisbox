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
    const panelLayouts = scenario?.panelLayouts!;
    const togglePanel = (panelIndex: number) => {
        panelLayouts.toggleVisibility(panelIndex);
    };

    const breakpoint = panelLayouts.currentBreakpoint;
    const layout = panelLayouts.currentLayouts[breakpoint];

    return layout.map((panel, idx) => {
        const onClick = () => togglePanel(idx);
        const visible = panel.visible;

        const displayedItem = (
            <>
                <ListItemIcon>{visible ? <Check /> : null}</ListItemIcon>
                <ListItemText>{panel.i}</ListItemText>
            </>
        );

        return (
            <MenuItem key={"menu_item_key_" + panel.i} onClick={onClick}>
                {displayedItem}
            </MenuItem>
        );
    });
});

export default ViewMenuList;