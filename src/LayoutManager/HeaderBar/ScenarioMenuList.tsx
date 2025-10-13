import MenuItem from '@mui/material/MenuItem';
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { downloadScenario } from "./DownloadScenario";
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ScenarioUploadDialog from "./ScenarioUploadDialog";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import RouteIcon from '@mui/icons-material/Route';
import Divider from '@mui/material/Divider';
import { useScenario } from "../../ScenarioManager/ScenarioManager";

export const ScenarioMenuList: React.FC<{ handleClose: () => void }> = observer(({ handleClose }) => {
    const scenario = useScenario();
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

    const server_load = (filename) => {
        handleClose();
        fetch(filename)
            .then(response => response.json())
            .then(data => {
                scenario.completeInitialization(data);
            })
            .catch(error => {
                console.error(`Failed to load scenario ${filename}:`, error);
            });
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
            <MenuItem onClick={() => server_load("ScenarioConfigs/UncertaintyTube.json")}>
                <ListItemIcon><RouteIcon /></ListItemIcon>
                <ListItemText>Uncertainty Tubes</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => server_load("ScenarioConfigs/Wildfire.json")}>
                <ListItemIcon><WhatshotIcon /></ListItemIcon>
                <ListItemText>Wildfire</ListItemText>
            </MenuItem>
            
            <Divider>Scenarios</Divider>
            <MenuItem onClick={() => downloadScenario(scenario, handleClose)}>
                <ListItemIcon><FileDownloadIcon /></ListItemIcon>
                <ListItemText>Download Scenario</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => setUploadDialogOpen(true)}>
                <ListItemIcon><FileUploadIcon /></ListItemIcon>
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