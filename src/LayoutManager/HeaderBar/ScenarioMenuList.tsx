import MenuItem from '@mui/material/MenuItem';
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { downloadScenario } from "./DownloadScenario";
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ScenarioDownloadDialog from "./ScenarioDownloadDialog";
import ScenarioUploadDialog from "./ScenarioUploadDialog";
import { Download, LayoutGrid, MessageSquare, Upload } from 'lucide-react';
import Divider from '@mui/material/Divider';
import { loadScenario, loadScenarioFromText, useScenario, type ScenarioSource } from "../../ScenarioManager/ScenarioManager";
import { scenarioRegistry, type ScenarioDefinition } from "../../Scenarios";
import type { ScenarioLayoutChoice } from "../../Types/Scenario";

export const ScenarioMenuList: React.FC<{ handleClose: () => void }> = observer(({ handleClose }) => {
    const scenario = useScenario();
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);

    const load = (source: ScenarioSource) => {
        handleClose();
        loadScenario(scenario, source);
    };

    const handleUploadScenario = (jsonString: string) => {
        setUploadDialogOpen(false);
        handleClose();
        loadScenarioFromText(scenario, jsonString);
    };

    const handleDownloadScenario = (layout: ScenarioLayoutChoice) => {
        setDownloadDialogOpen(false);
        downloadScenario(scenario, handleClose, layout);
    };

    // Every registered scenario with a config: the library's built-in examples, then the host's own.
    const loadable = scenarioRegistry.definitions().filter(definition => definition.defaultConfig || definition.defaultConfigPath);
    const menuItemsOf = (definitions: ScenarioDefinition[]) => definitions.map(definition => (
        <MenuItem key={definition.name} selected={definition.name === scenario.name}
                  onClick={() => load(definition.defaultConfig ?? definition.defaultConfigPath!)}>
            <ListItemIcon>{definition.isExample ? <MessageSquare size={16} strokeWidth={1.75} /> : <LayoutGrid size={16} strokeWidth={1.75} />}</ListItemIcon>
            <ListItemText>{definition.name}</ListItemText>
        </MenuItem>
    ));

    const onClose = () => {
        setUploadDialogOpen(false);
        setDownloadDialogOpen(false);
        handleClose();
    }

    return (
        <>
            <Divider>Examples</Divider>
            {menuItemsOf(loadable.filter(definition => definition.isExample))}

            <Divider>Scenarios</Divider>
            {menuItemsOf(loadable.filter(definition => !definition.isExample))}
            <Divider />
            <MenuItem onClick={() => setDownloadDialogOpen(true)}>
                <ListItemIcon><Download size={16} strokeWidth={1.75} /></ListItemIcon>
                <ListItemText>Download Scenario</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => setUploadDialogOpen(true)}>
                <ListItemIcon><Upload size={16} strokeWidth={1.75} /></ListItemIcon>
                <ListItemText>Upload Scenario</ListItemText>
            </MenuItem>

            <ScenarioDownloadDialog
                open={downloadDialogOpen}
                onClose={onClose}
                onDownload={handleDownloadScenario}
            />

            <ScenarioUploadDialog
                open={uploadDialogOpen}
                onClose={onClose}
                onUpload={handleUploadScenario}
            />
        </>
    );
});

export default ScenarioMenuList;