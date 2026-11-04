// ABOUTME: Shows why the last scenario load failed (missing or invalid config, unregistered scenario, failed
// ABOUTME: initialization) on screen until dismissed, so a failed load is never silent.

import { observer } from "mobx-react-lite";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { useTheme } from "@mui/material/styles";
import { SHAPE } from "../Theme/DesignTokens";
import { useScenario } from "./ScenarioManager";

export const LoadErrorBanner = observer(() => {
    const scenario = useScenario();
    const tokens = useTheme().tokens;
    if (!scenario.loadError) {
        return null;
    }
    return (
        <Alert severity="error" variant="filled" onClose={() => scenario.setLoadError(null)}
               sx={{ position: 'fixed', top: tokens.px(SHAPE.navbarHeight + 12), left: '50%', transform: 'translateX(-50%)',
                     zIndex: 2000, width: 'min(640px, calc(100vw - 32px))', boxShadow: tokens.shadowRaised }}>
            <AlertTitle>The scenario could not be loaded</AlertTitle>
            {scenario.loadError}
        </Alert>
    );
});

export default LoadErrorBanner;
