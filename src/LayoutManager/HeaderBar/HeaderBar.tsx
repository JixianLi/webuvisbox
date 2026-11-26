// ABOUTME: Application navbar: brand mark, scenario name and description, the Scenario, Layout and Views menus,
// ABOUTME: the full screen button and the display mode switch (bright, dark, neutral). On phones the menus fold into one.

import React from "react";
import { observer } from "mobx-react-lite";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { ChevronDown, Moon, SunMedium, Contrast, Keyboard, Ellipsis, Maximize, Minimize } from "lucide-react";
import ListSubheader from "@mui/material/ListSubheader";
import useMediaQuery from "@mui/material/useMediaQuery";
import IconButton from "@mui/material/IconButton";

import ViewMenuList from "./ViewMenuList";
import LayoutMenuList from "./LayoutMenuList";
import ScenarioMenuList from "./ScenarioMenuList";
import { useDisplaySettings } from "../../DisplaySettingsContext";
import { commandRegistry, shortcutLabel } from "../../Commands/CommandRegistry";
import { useScenario } from "../../ScenarioManager/ScenarioManager";
import { isFullscreenSupported, toggleFullscreen, useIsFullscreen } from "../../Helpers/Fullscreen";
import { SHAPE, TYPE, UI_SCALES, type DisplayMode } from "../../Theme/DesignTokens";

const MODE_CHOICES: Array<{ mode: DisplayMode; label: string; Icon: typeof Moon }> = [
    { mode: 'bright', label: 'Bright', Icon: SunMedium },
    { mode: 'dark', label: 'Dark', Icon: Moon },
    { mode: 'neutral', label: 'Neutral (for judging color)', Icon: Contrast },
];

const NavbarMenu: React.FC<{ label: string; children: (close: () => void) => React.ReactNode }> = ({ label, children }) => {
    const px = useTheme().tokens.px;
    const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);
    const close = () => setAnchor(null);
    return (
        <>
            <Button color="inherit" size="small" onClick={event => setAnchor(event.currentTarget)}
                    endIcon={<ChevronDown size={px(14)} strokeWidth={1.75} style={{ opacity: 0.7 }} />}
                    sx={{ px: 1.25, minWidth: 0, fontSize: px(13), fontWeight: 500, opacity: anchor ? 1 : 0.85,
                          '& .MuiButton-endIcon': { ml: 0.5 } }}>
                {label}
            </Button>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
                <MenuList dense disablePadding>{children(close)}</MenuList>
            </Menu>
        </>
    );
};

const SEGMENTED = {
    gap: 0.25, p: 0.25, borderRadius: 1, backgroundColor: 'rgba(127,127,127,0.12)',
    '& .MuiToggleButton-root': { color: 'inherit', border: 'none', borderRadius: '6px !important', px: 0.9, py: 0.5, opacity: 0.6 },
    '& .MuiToggleButton-root.Mui-selected': { opacity: 1, backgroundColor: 'rgba(127,127,127,0.22)', color: 'inherit' },
};

const DisplayModeSwitch: React.FC = () => {
    const { mode, setMode } = useDisplaySettings();
    const px = useTheme().tokens.px;
    return (
        <ToggleButtonGroup size="small" exclusive value={mode} sx={SEGMENTED}
                           onChange={(_, value: DisplayMode | null) => value && setMode(value)}>
            {MODE_CHOICES.map(({ mode: choice, label, Icon }) => (
                <Tooltip key={choice} title={label}>
                    <ToggleButton value={choice} aria-label={label}><Icon size={px(15)} strokeWidth={1.75} /></ToggleButton>
                </Tooltip>
            ))}
        </ToggleButtonGroup>
    );
};

const UiScaleItems: React.FC<{ handleClose: () => void }> = ({ handleClose }) => {
    const { uiScale, setUiScale } = useDisplaySettings();
    return <>{UI_SCALES.map(scale => (
        <MenuItem key={scale} selected={Math.abs(scale - uiScale) < 1e-6}
                  onClick={() => { setUiScale(scale); handleClose(); }}>
            UI {Math.round(scale * 100)}%
        </MenuItem>
    ))}</>;
};

const UiScaleMenu: React.FC = () => {
    const { uiScale } = useDisplaySettings();
    return (
        <NavbarMenu label={`${Math.round(uiScale * 100)}%`}>
            {close => <UiScaleItems handleClose={close} />}
        </NavbarMenu>
    );
};

// Phones: the Scenario, Layout, Views and UI size menus as sections of one menu, so the navbar fits.
const CompactMenu: React.FC = () => {
    const px = useTheme().tokens.px;
    const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);
    const close = () => setAnchor(null);
    const section = { lineHeight: 2.25, backgroundColor: 'transparent' };
    return (
        <>
            <IconButton color="inherit" size="small" aria-label="menu" onClick={event => setAnchor(event.currentTarget)}>
                <Ellipsis size={px(18)} strokeWidth={1.75} />
            </IconButton>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
                <MenuList dense disablePadding>
                    <ListSubheader sx={section}>Scenario</ListSubheader>
                    <ScenarioMenuList handleClose={close} />
                    <ListSubheader sx={section}>Layout</ListSubheader>
                    <LayoutMenuList handleClose={close} />
                    <ListSubheader sx={section}>Views</ListSubheader>
                    <ViewMenuList />
                    <ListSubheader sx={section}>UI size</ListSubheader>
                    <UiScaleItems handleClose={close} />
                </MenuList>
            </Menu>
        </>
    );
};

const FullscreenButton: React.FC = () => {
    const px = useTheme().tokens.px;
    const isFullscreen = useIsFullscreen();
    if (!isFullscreenSupported()) return null;
    const label = isFullscreen ? 'Exit full screen' : 'Full screen';
    const Icon = isFullscreen ? Minimize : Maximize;
    return (
        <Tooltip title={`${label} (${shortcutLabel('Alt+Enter')})`}>
            <IconButton color="inherit" size="small" aria-label={label} sx={{ opacity: 0.75 }} onClick={toggleFullscreen}>
                <Icon size={px(17)} strokeWidth={1.75} />
            </IconButton>
        </Tooltip>
    );
};

const BrandMark: React.FC<{ onAccent: boolean }> = ({ onAccent }) => {
    const theme = useTheme();
    const px = theme.tokens.px;
    return <Box sx={{ width: px(18), height: px(18), borderRadius: `${px(5)}px`, flexShrink: 0,
                      backgroundColor: onAccent ? '#FFFFFF' : theme.tokens.chrome?.text ?? theme.tokens.accentFill,
                      boxShadow: onAccent ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.25)' }} />;
};

const HeaderBar: React.FC = observer(() => {
    const scenario = useScenario();
    const theme = useTheme();
    const tokens = theme.tokens;
    const onAccent = tokens.navbar === 'accent';
    const compact = useMediaQuery(theme.breakpoints.down('sm'));
    const header = { height: tokens.px(SHAPE.navbarHeight), display: 'flex', alignItems: 'center', gap: 1.5, px: 1.75,
                     backgroundColor: onAccent ? tokens.accent : tokens.chrome?.fill ?? tokens.surface,
                     color: onAccent ? '#FFFFFF' : tokens.chrome?.text ?? tokens.text,
                     borderBottom: onAccent ? 'none' : `1px solid ${tokens.border}` };
    const title = (
        <Typography component="h1" noWrap
                    sx={{ fontSize: tokens.px(TYPE.navbarTitleSize), fontWeight: 600, letterSpacing: '-0.01em', minWidth: 0 }}>
            {scenario.name}
        </Typography>
    );

    // Phones have no keyboard, so the shortcuts button goes too.
    if (compact) {
        return (
            <Box component="header" sx={header}>
                <BrandMark onAccent={onAccent} />
                {title}
                <Box sx={{ flexGrow: 1 }} />
                <FullscreenButton />
                <DisplayModeSwitch />
                <CompactMenu />
            </Box>
        );
    }

    return (
        <Box component="header" sx={header}>
            <BrandMark onAccent={onAccent} />
            {title}
            {scenario.description && (
                <Typography sx={{ fontSize: tokens.px(13), opacity: 0.65, display: { xs: 'none', md: 'block' } }} noWrap>
                    {scenario.description}
                </Typography>
            )}
            <Box sx={{ width: '1px', height: 18, backgroundColor: 'currentColor', opacity: 0.18, mx: 0.5 }} />
            <Box sx={{ display: 'flex', gap: 0.25 }}>
                <NavbarMenu label="Scenario">{close => <ScenarioMenuList handleClose={close} />}</NavbarMenu>
                <NavbarMenu label="Layout">{close => <LayoutMenuList handleClose={close} />}</NavbarMenu>
                <NavbarMenu label="Views">{() => <ViewMenuList />}</NavbarMenu>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <UiScaleMenu />
            <Tooltip title={`Keyboard shortcuts (${shortcutLabel('Shift+Slash')})`}>
                <IconButton color="inherit" size="small" aria-label="keyboard shortcuts" sx={{ opacity: 0.75 }}
                            onClick={() => commandRegistry.setShortcutsOpen(true)}>
                    <Keyboard size={tokens.px(17)} strokeWidth={1.75} />
                </IconButton>
            </Tooltip>
            <FullscreenButton />
            <DisplayModeSwitch />
        </Box>
    );
});

export default HeaderBar;
