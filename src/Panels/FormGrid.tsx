import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";

interface ConfigContentContainerProps {
    spacing?: number;
    padding?: number;
    children?: React.ReactNode;
    sx?: object;
}

export const FormGrid = (props: ConfigContentContainerProps) => {
    return <Box sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex', width: 1 }}>
        <Grid container spacing={props.spacing || 2} sx={{ p: props.padding ?? 0, pt: props.padding ?? '8px', width: 1, ...props.sx }}>
            {props.children}
        </Grid>
    </Box>
};

export default FormGrid;