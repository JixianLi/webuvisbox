import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Check } from "lucide-react";

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
                <Check size={16} strokeWidth={1.75} style={{ visibility: props.checked ? 'visible' : 'hidden' }} />
            </ListItemIcon>
            <ListItemText primary={props.text} />
        </MenuItem>
    );
};
export default CheckMenuItem;