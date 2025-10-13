import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Menu from "@mui/material/Menu";
import Clear from "@mui/icons-material/Clear";
import HelpOutline from "@mui/icons-material/HelpOutline";
import { useState } from "react";
import { useScenario } from "@/ScenarioManager/ScenarioManager";

interface PanelProps {
    panel_name: string;
    children?: React.ReactNode;
    appbar_content?: React.ReactNode;
    help_content?: React.ReactNode;
    sx?: object;
}

const content_style = { display: 'flex', flexDirection: 'column', flex: 1, m: 2, overflow: 'auto', justifyContent: 'flex-start', alignItems: 'center' };
const container_style = { width: 1, height: 1, padding: 0, margin: 0, display: 'flex', flexDirection: 'column' };
const paper_style = { width: 1, height: 1, flexGrow: 1};

export function Panel(props: PanelProps) {
    const scenario = useScenario();
    const panel_name = props.panel_name;

    const [help_anchor, setHelpAnchor] = useState(null);

    const onHelpClick = (event: React.MouseEvent<HTMLElement>) => {
        setHelpAnchor(event.currentTarget);
    };

    const onHelpClose = () => {
        setHelpAnchor(null);
    };

    const hidePanel = () => {
        scenario.panel_layouts.close_panel(panel_name);
    };

    return <Paper elevation={5} key={"paper_" + panel_name} sx={paper_style}>
        <Container disableGutters maxWidth={false} sx={container_style}>
            <Box sx={{ flexShrink: 1 }}>
                <AppBar position={'static'} color={'primary'} sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
                    <Typography variant={'h6'} component="div" sx={{ flexGrow: 1, ml: 1 }} className={"drag-handle"}>
                        {panel_name}
                    </Typography>
                    {props.appbar_content}
                    <IconButton
                        size="small"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ mr: 1 }}
                        onClick={onHelpClick}
                    >
                        <HelpOutline />
                    </IconButton>
                    <Menu anchorEl={help_anchor}
                        open={Boolean(help_anchor)}
                        onClose={onHelpClose}
                    >
                        {props.help_content}
                    </Menu>

                    <IconButton
                        size="small"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ mr: 1 }}
                        onClick={hidePanel}
                    >
                        <Clear />
                    </IconButton>
                </AppBar>
            </Box>
            <Box sx={content_style} minHeight={0}>
                {props.children}
            </Box>
        </Container>
    </Paper>
}

export default Panel;