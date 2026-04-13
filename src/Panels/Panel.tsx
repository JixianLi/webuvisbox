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
    panelName: string;
    children?: React.ReactNode;
    appbarContent?: React.ReactNode;
    helpContent?: React.ReactNode;
    sx?: object;
}

const contentStyle = { display: 'flex', flexDirection: 'column', flex: 1, m: 2, overflow: 'auto', justifyContent: 'flex-start', alignItems: 'center' };
const containerStyle = { width: 1, height: 1, padding: 0, margin: 0, display: 'flex', flexDirection: 'column' };
const paperStyle = { width: 1, height: 1, flexGrow: 1};

export function Panel(props: PanelProps) {
    const scenario = useScenario();
    const panelName = props.panelName;

    const [helpAnchor, setHelpAnchor] = useState(null);

    const onHelpClick = (event: React.MouseEvent<HTMLElement>) => {
        setHelpAnchor(event.currentTarget);
    };

    const onHelpClose = () => {
        setHelpAnchor(null);
    };

    const hidePanel = () => {
        scenario.panelLayouts.closePanel(panelName);
    };

    return <Paper elevation={5} key={"paper_" + panelName} sx={paperStyle}>
        <Container disableGutters maxWidth={false} sx={containerStyle}>
            <Box sx={{ flexShrink: 1 }}>
                <AppBar position={'static'} color={'primary'} sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
                    <Typography variant={'h6'} component="div" sx={{ flexGrow: 1, ml: 1 }} className={"drag-handle"}>
                        {panelName}
                    </Typography>
                    {props.appbarContent}
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
                    <Menu anchorEl={helpAnchor}
                        open={Boolean(helpAnchor)}
                        onClose={onHelpClose}
                    >
                        {props.helpContent}
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
            <Box sx={contentStyle} minHeight={0}>
                {props.children}
            </Box>
        </Container>
    </Paper>
}

export default Panel;