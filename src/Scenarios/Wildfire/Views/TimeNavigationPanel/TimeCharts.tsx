import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type WildfireGlobalContext from "../../WildfireGlobalData";
import Box from "@mui/material/Box";
import TimeLineChart from "./TimeLineChart";

const TimeCharts = observer(() => {
    const scenario = useScenario();
    const global_data = scenario.global_context as WildfireGlobalContext;
    const line_charts = global_data.time_diff_data?.data_names.map((name) => {
        return (
            <Box key={name} sx={{ flexGrow: 1, w: 1, m: 0.1 }} minHeight={200}>
                <TimeLineChart name={name} />
            </Box>
        );
    });
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, width: '100%' }}>
            {line_charts}
        </Box>
    );
});

export default TimeCharts;
