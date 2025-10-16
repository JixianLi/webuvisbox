import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";

interface ConfigContentContainerProps {
    spacing?: number;
    padding?: number;
    children?: React.ReactNode;
    sx?: object;
}

export const GridLayoutContainer = (props: ConfigContentContainerProps) => {
    return <Box sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex', p: "10px" }}>
        <Grid container spacing={props.spacing || 2} sx={{ p: props.padding || "10px", ...props.sx }}>
            {props.children}
        </Grid>
    </Box>
};

export default GridLayoutContainer;