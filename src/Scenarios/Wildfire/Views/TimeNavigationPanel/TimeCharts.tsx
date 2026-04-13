import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type WildfireGlobalContext from "../../WildfireGlobalContext";
import Box from "@mui/material/Box";
import TimeLineChart from "./TimeLineChart";

const TimeCharts = observer(() => {
    const scenario = useScenario();
    const globalData = scenario.globalContext as WildfireGlobalContext;
    const lineCharts = globalData.timeDiffData?.dataNames.map((name) => {
        return (
            <Box key={name} sx={{ flexGrow: 1, w: 1, m: 0.1 }} minHeight={200}>
                <TimeLineChart name={name} />
            </Box>
        );
    });
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, width: '100%' }}>
            {lineCharts}
        </Box>
    );
});

export default TimeCharts;
