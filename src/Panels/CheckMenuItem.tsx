import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Check } from "@mui/icons-material";

/**
 * A menu item that toggles options.
 * @returns A menu item component.
 */

interface CheckMenuItemProps {
    text?: string;
    onClick?: () => void;
    checked?: boolean;
}
export const CheckMenuItem = (props: CheckMenuItemProps) => {
    return (
        <MenuItem onClick={props.onClick}>
            <ListItemIcon>
                <Check style={{ visibility: props.checked ? 'visible' : 'hidden' }} />
            </ListItemIcon>
            <ListItemText primary={props.text} />
        </MenuItem>
    );
};
export default CheckMenuItem;