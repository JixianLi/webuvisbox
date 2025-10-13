import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";

interface ConfigContentContainerProps {
    spacing?: number;
    padding?: number;
    children?: React.ReactNode;
    sx?: object;
}

export const GridLayoutContainer = (props: ConfigContentContainerProps) => {
    return <Box sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex', width: '100%', height: '100%', p: "10px" }}>
        <Grid container spacing={props.spacing || 2} sx={{ p: props.padding || "10px", width: '100%', height: '100%', ...props.sx }}>
            {props.children}
        </Grid>
    </Box>
};

export default GridLayoutContainer;