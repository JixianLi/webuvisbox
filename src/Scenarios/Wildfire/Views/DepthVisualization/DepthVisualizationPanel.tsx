// ABOUTME: Panel wrapper for depth visualization of the Wildfire terrain scene.
// ABOUTME: Displays logarithmic depth as inverted grayscale (near=bright, far=dark).

import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import { Panel } from "@/Panels/Panel";
import DepthTerrainRenderer, { type DepthTerrainRendererHandle } from "./DepthTerrainRenderer";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import SaveAltIcon from "@mui/icons-material/SaveAlt";

const DepthVisualizationPanel = observer(() => {
    const rendererRef = useRef<DepthTerrainRendererHandle>(null);
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
        <Panel panel_name="Depth Visualization" appbar_content={appBarContent}>
            <DepthTerrainRenderer ref={rendererRef} />
        </Panel>
    );
});

export default DepthVisualizationPanel;
