// ABOUTME: Application header bar with scenario name and hamburger menu.
// ABOUTME: Contains dark mode toggle, layout options, and view list menus.

import React from "react";
import { observer } from "mobx-react-lite";

import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuList from "@mui/material/MenuList";
import MenuIcon from "@mui/icons-material/Menu";
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import { useTheme } from "@mui/material/styles";

import ViewMenuList from "./ViewMenuList";
import LayoutMenuList from "./LayoutMenuList";
import ScenarioMenuList from "./ScenarioMenuList";
import { useThemeMode } from "../../ThemeModeContext";
import { useScenario } from "../../ScenarioManager/ScenarioManager";

const HeaderMenu: React.FC = () => {
    const theme = useTheme();
    const { toggleMode } = useThemeMode();

    const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchor);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchor(event.currentTarget);
    };

    const handleClose = () => {
        setAnchor(null);
    };

    return (
        <>
            <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={handleClick}
            >
                <MenuIcon />
            </IconButton>
            <Menu
                anchorEl={anchor}
                open={open}
                onClose={handleClose}
            >
                <MenuList dense>
                    <ScenarioMenuList handleClose={handleClose} />
                    <Divider>Layout Options</Divider>
                    <LayoutMenuList handleClose={handleClose} />
                    <Divider>View List</Divider>
                    <ViewMenuList />
                    <Divider />
                    <Switch checked={theme.palette.mode === 'dark'} onChange={toggleMode} /> Dark Mode
                </MenuList>
            </Menu>
        </>
    );
};

const HeaderBar: React.FC = observer(() => {
    const scenario = useScenario();
    const name = scenario.name;
    return (
        <Box>
            <AppBar position="static">
                <Toolbar>
                    <HeaderMenu />
                    <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>{name}</Typography>
                </Toolbar>
            </AppBar>
        </Box>
    )
});

export default HeaderBar;
