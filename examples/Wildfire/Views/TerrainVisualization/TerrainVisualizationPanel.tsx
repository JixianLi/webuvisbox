import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import { Panel } from "@/Panels/Panel";
import TerrainRenderer, { type TerrainRendererHandle } from "./TerrainRenderer";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import SaveAltIcon from "@mui/icons-material/SaveAlt";

const TerrainVisualizationPanel = observer(() => {
    const rendererRef = useRef<TerrainRendererHandle>(null);
    const [anchor, setAnchor] = useState<null | HTMLElement>(null);

    const onMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchor(event.currentTarget);
    };

    const onMenuClose = () => {
        setAnchor(null);
    };

    const saveImage = () => {
        rendererRef.current?.saveImage();
        onMenuClose();
    };

    const appBarContent = (
        <>
            <IconButton
                size="small"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={onMenuClick}
            >
                <MenuIcon />
            </IconButton>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={onMenuClose}>
                <MenuList dense>
                    <MenuItem onClick={saveImage}>
                        <ListItemIcon><SaveAltIcon /></ListItemIcon>
                        <ListItemText>Save as PNG</ListItemText>
                    </MenuItem>
                </MenuList>
            </Menu>
        </>
    );

    return (
        <Panel panelName="Terrain Visualization" appbarContent={appBarContent}>
            <TerrainRenderer ref={rendererRef} />
        </Panel>
    );
});

export default TerrainVisualizationPanel;