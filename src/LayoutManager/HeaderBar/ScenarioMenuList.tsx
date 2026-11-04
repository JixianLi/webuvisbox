import MenuItem from '@mui/material/MenuItem';
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { downloadScenario } from "./DownloadScenario";
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ScenarioUploadDialog from "./ScenarioUploadDialog";
import { Download, MessageSquare, Upload } from 'lucide-react';
import Divider from '@mui/material/Divider';
import { useScenario } from "../../ScenarioManager/ScenarioManager";

export const ScenarioMenuList: React.FC<{ handleClose: () => void }> = observer(({ handleClose }) => {
    const scenario = useScenario();
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

    const server_load = async (filename: string) => {
        handleClose();
        try {
            const response = await fetch(filename);
            const data = await response.json();
            await scenario.completeInitialization(data);
        } catch (error) {
            console.error(`Failed to load scenario ${filename}:`, error);
        }
    }


    const handleUploadScenario = (jsonString: string) => {
        console.log("Uploading scenario...");
        setUploadDialogOpen(false);
        handleClose();
        
        scenario.loadFromJson(jsonString);
        scenario.asyncInitialization().catch(error => {
            console.error("Error during async initialization of uploaded scenario:", error);
        }).then(() => {
            console.log("Uploaded scenario loaded successfully.");
        });
    };

    const onClose = () => {
        setUploadDialogOpen(false);
        handleClose();
    }

    return (
        <>
            <Divider>Examples</Divider>
            <MenuItem onClick={() => server_load("ScenarioConfigs/ChatUI.json")}>
                <ListItemIcon><MessageSquare size={16} strokeWidth={1.75} /></ListItemIcon>
                <ListItemText>chatUI</ListItemText>
            </MenuItem>
            
            <Divider>Scenarios</Divider>
            <MenuItem onClick={() => downloadScenario(scenario, handleClose)}>
                <ListItemIcon><Download size={16} strokeWidth={1.75} /></ListItemIcon>
                <ListItemText>Download Scenario</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => setUploadDialogOpen(true)}>
                <ListItemIcon><Upload size={16} strokeWidth={1.75} /></ListItemIcon>
                <ListItemText>Upload Scenario</ListItemText>
            </MenuItem>
            

            <ScenarioUploadDialog
                open={uploadDialogOpen}
                onClose={onClose}
                onUpload={handleUploadScenario}
            />
        </>
    );
});

export default ScenarioMenuList;